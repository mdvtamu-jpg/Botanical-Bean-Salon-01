import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Sparkles, Plus, X, Heart, 
  Instagram, Anchor, Image as ImageIcon, Send, ArrowUpRight, Edit2, Check, Trash2
} from 'lucide-react';
import { collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHelper';
import { MemoryPost, PHOTO_PRESETS, PRESEEDED_MEMORIES } from '../data/memoriesData';

interface ParlorMemoriesProps {
  onMemoriesLoaded?: (mems: MemoryPost[]) => void;
  isAdmin?: boolean;
}

// Helper to determine if a name is an Instagram handle
const isInstagramHandle = (name: string): boolean => {
  const trimmed = name.trim();
  if (trimmed.startsWith('@')) return true;
  // If no spaces, contains only letter, number, dot, underscore, it is highly likely an Instagram user ID
  return /^[a-zA-Z0-9_.]+$/.test(trimmed) && trimmed.length >= 2;
};

const getInstagramLink = (handle: string): string => {
  const clean = handle.replace('@', '').trim();
  return `https://www.instagram.com/${clean}`;
};

const formatDisplayName = (name: string): string => {
  const trimmed = name.trim();
  if (isInstagramHandle(trimmed) && !trimmed.startsWith('@')) {
    return `@${trimmed}`;
  }
  return trimmed;
};

// Client-side image compressor of uploaded files to keep Firestore size in check
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Downscale to proportional max 600px square
        const max_size = 600;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Canvas context is missing"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Exquisite visual compromise at 0.75 ratio compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error("Failed to load image element"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

export default function ParlorMemories({ onMemoriesLoaded, isAdmin }: ParlorMemoriesProps) {
  const [memories, setMemories] = useState<MemoryPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [myMemoryId, setMyMemoryId] = useState<string>(() => localStorage.getItem('my_cafe_memory_id') || '');
  const [myCreatorId, setMyCreatorId] = useState<string>(() => {
    let cid = localStorage.getItem('my_cafe_memory_creator_id');
    if (!cid) {
      cid = 'creator_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('my_cafe_memory_creator_id', cid);
    }
    return cid;
  });

  // Form states
  const [guestName, setGuestName] = useState('');
  const [caption, setCaption] = useState('');
  
  // Decide active image source: 'preset' or 'upload'
  const [activePhotoSource, setActivePhotoSource] = useState<'preset' | 'upload'>('preset');
  const [selectedPhoto, setSelectedPhoto] = useState(PHOTO_PRESETS[0].url);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Lightbox Zoom state for polaroids
  const [zoomedMemory, setZoomedMemory] = useState<MemoryPost | null>(null);

  const handleDeleteMemory = async (targetId?: string) => {
    const idToDelete = targetId || myMemoryId;
    if (!idToDelete) return;
    
    const isOwnerOfMemory = idToDelete === myMemoryId;
    if (!isAdmin && !isOwnerOfMemory) {
      alert("Moderation permissions required. Please log in as the owner from the trademark symbol nested stamp at the bottom to perform purging operations.");
      return;
    }

    if (!window.confirm("Are you sure you want to permanently dissolve this guest memory snap from the greenhouse wall? 🌿")) return;
    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const targetMemo = memories.find(m => m.id === idToDelete);
      if (!targetMemo) {
        throw new Error("Memory not found in local index");
      }

      // 1. Send authorization validation payload and state
      const docRef = doc(db, 'cafe_memories', idToDelete);
      if (isAdmin) {
        const token = localStorage.getItem('teahouse_admin_session_token') || '';
        await updateDoc(docRef, {
          deleteRequested: true,
          adminSessionToken: token
        });
      } else {
        await updateDoc(docRef, {
          deleteRequested: true,
          deleteToken: myCreatorId
        });
      }

      // 2. Flush target from live database
      await deleteDoc(docRef);

      if (idToDelete === myMemoryId) {
        localStorage.removeItem('my_cafe_memory_id');
        setMyMemoryId('');
        setGuestName('');
        setCaption('');
        setUploadedPhotoBase64('');
        setSelectedPhoto(PHOTO_PRESETS[0].url);
        setActivePhotoSource('preset');
      }
      setSuccessMessage("Your memory has been successfully dissolved from the wall gallery. 🌿");
      setShowDeleteConfirm(false);
      setTimeout(() => {
        setShowForm(false);
        setSuccessMessage('');
        setIsDeleting(false);
      }, 2000);
    } catch (err: any) {
      setErrorMessage("The teahouse logs could not purge this entry at this moment. Double check your connection!");
      setIsDeleting(false);
      handleFirestoreError(err, OperationType.DELETE, `cafe_memories/${idToDelete}`);
    }
  };

  // Fetch live memories in real-time
  useEffect(() => {
    const q = query(collection(db, 'cafe_memories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        const seedMemories = async () => {
          for (const item of PRESEEDED_MEMORIES) {
            try {
              await setDoc(doc(db, 'cafe_memories', item.id), {
                guestName: item.guestName,
                caption: item.caption,
                imageUrl: item.imageUrl,
                createdAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Seeding memory error:", err);
            }
          }
        };
        seedMemories();
      } else {
        const dbMemories: MemoryPost[] = [];
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          let isExpired = false;
          if (data.createdAt) {
            const createdTime = data.createdAt.toMillis ? data.createdAt.toMillis() : (typeof data.createdAt === 'number' ? data.createdAt : null);
            if (createdTime && (now - createdTime > thirtyDaysMs)) {
              isExpired = true;
            }
          }

          if (isExpired) {
            try {
              deleteDoc(doc(db, 'cafe_memories', docSnap.id));
            } catch (err) {
              console.error("Expired snapshot auto-cleanup error:", err);
            }
          } else {
            dbMemories.push({
              id: docSnap.id,
              ...data
            } as MemoryPost);
          }
        });
        setMemories(dbMemories);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'cafe_memories');
    });

    return unsub;
  }, []);

  // Use dynamic memories from DB as main source; fallback to PRESEEDED_MEMORIES if DB is empty/loading
  const allMemories = React.useMemo(() => {
    return memories.length > 0 ? memories.slice(0, 10) : PRESEEDED_MEMORIES;
  }, [memories]);

  // Send memories up to the parent component so the top hero banner can show them!
  useEffect(() => {
    if (onMemoriesLoaded) {
      onMemoriesLoaded(allMemories);
    }
  }, [allMemories, onMemoriesLoaded]);

  // Check if current user has an active memory posted
  const userExistingMemory = memories.find(m => m.id === myMemoryId);

  // Populate form with existing memory details for editing
  const handleOpenForm = () => {
    if (userExistingMemory) {
      setGuestName(userExistingMemory.guestName);
      setCaption(userExistingMemory.caption);
      
      const isPreset = PHOTO_PRESETS.some(p => p.url === userExistingMemory.imageUrl);
      if (isPreset) {
        setSelectedPhoto(userExistingMemory.imageUrl);
        setUploadedPhotoBase64('');
        setActivePhotoSource('preset');
      } else {
        setUploadedPhotoBase64(userExistingMemory.imageUrl);
        setSelectedPhoto('');
        setActivePhotoSource('upload');
      }
    } else {
      setGuestName('');
      setCaption('');
      setSelectedPhoto(PHOTO_PRESETS[0].url);
      setUploadedPhotoBase64('');
      setActivePhotoSource('preset');
    }
    setErrorMessage('');
    setSuccessMessage('');
    setShowForm(!showForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !caption.trim()) {
      setErrorMessage("Please complete your lovely name and guest memory caption.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Normalize display name with formatting
    const finalGuestName = formatDisplayName(guestName);

    // Pick correct URL based on user tab selection
    const finalImageUrl = activePhotoSource === 'upload' ? uploadedPhotoBase64 : selectedPhoto;

    if (!finalImageUrl) {
      setErrorMessage("Please choose an aesthetic backdrop or upload your own custom photo.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (myMemoryId && userExistingMemory) {
        // Update existing memory (Editable)
        const docRef = doc(db, 'cafe_memories', myMemoryId);
        await updateDoc(docRef, {
          guestName: finalGuestName,
          caption: caption.trim(),
          imageUrl: finalImageUrl,
          creatorId: myCreatorId
        });
        setSuccessMessage("Your memory snapshot has been beautifully updated!");
      } else {
        // Create new memory
        const docRef = await addDoc(collection(db, 'cafe_memories'), {
          guestName: finalGuestName,
          caption: caption.trim(),
          imageUrl: finalImageUrl,
          creatorId: myCreatorId,
          createdAt: serverTimestamp()
        });
        localStorage.setItem('my_cafe_memory_id', docRef.id);
        setMyMemoryId(docRef.id);
        setSuccessMessage("Successfully pinned your memory on the Greenhouse wall! 📌");
      }

      // Hide form after brief success delay
      setTimeout(() => {
        setShowForm(false);
        setSuccessMessage('');
      }, 2500);

    } catch (err: any) {
      setErrorMessage("The parlor scribe could not commit your layout. Enjoy a sip of coffee and try again!");
      handleFirestoreError(err, OperationType.WRITE, myMemoryId ? `cafe_memories/${myMemoryId}` : 'cafe_memories');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Random rotation styled tilts for natural Polaroid look
  const getTilt = (id: string | undefined) => {
    if (!id) return 'rotate-1';
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = sum % 3;
    if (mod === 0) return 'rotate-[-1.5deg]';
    if (mod === 1) return 'rotate-[1.8deg]';
    return 'rotate-[-0.8deg]';
  };

  return (
    <section className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-6 sm:p-8 text-left shadow-scrapbook relative overflow-hidden gold-trim" id="greenhouse-snapshots-wall">
      
      {/* Decorative tag stripe overlay */}
      <div className="absolute top-[-5px] right-[10%] px-5 py-2 tape-strip text-[9px] uppercase tracking-widest font-bold text-[#1B2820] select-none z-10">
        ✦ COZY CAFE MEMORIES • GREENHOUSE SNAPSHOTS ✦
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-dashed border-[#C8DFC0]">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C4924A] block font-display">
            🌿 Cozy Live Guest Book & Memory Wall
          </span>
          <h2 className="text-xl sm:text-2xl font-serif uppercase text-[#1B2820] tracking-tight leading-none pt-1">
            The Greenhouse Snapshots Gallery
          </h2>
          <p className="text-xs text-[#6a8a70] font-serif">
            Capturing the laughter of sweet couples, weekend workstation reading hours, and our baking journey notes. Limited to 10 memories.
          </p>
        </div>

        <button
          onClick={handleOpenForm}
          type="button"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-sm text-[9.5px] font-mono font-bold tracking-widest uppercase bg-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] border border-[#2E4035] shadow-xs transition-all duration-300 cursor-pointer shrink-0"
        >
          {showForm ? (
            <>
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Cancel Form</span>
            </>
          ) : userExistingMemory ? (
            <>
              <Edit2 className="w-3.5 h-3.5 mr-1 text-[#C4924A]" />
              <span>Re-Edit Your Post ✏️</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 mr-1" />
              <span>Pin Your Snapshot 📌</span>
            </>
          )}
        </button>
      </div>

      {/* Slide down form drawer to pin/edit user-memory */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden border-b border-[#C8DFC0] bg-[#FDFAF4]"
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest font-bold text-[#1B2820] flex items-center gap-1.5 font-display">
                  <Sparkles className="w-3.5 h-3.5 text-[#C4924A] animate-pulse" />
                  <span>{userExistingMemory ? "EDIT & REFRESH YOUR PARLOR POST" : "WRITE NEW GUESTBOOK MEMORY (1 PER PERSON)"}</span>
                </h3>
                {userExistingMemory && (
                  <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 border border-[#C4924A] text-[#C4924A] rounded-sm font-mono font-bold">
                    Editing Mode Active
                  </span>
                )}
              </div>

              {/* Informative Callout explaining the social networking benefits */}
              <div className="p-3.5 bg-[#F2EBD9] border border-[#C8DFC0] text-[#1B2820] text-[10.5px] rounded-sm space-y-1">
                <p className="font-semibold text-[#1B2820] uppercase tracking-wider text-[9px] font-mono text-[#C4924A]">
                  ✨ Cultivate Your Social Reach & Happy Memories
                </p>
                <p className="font-serif leading-relaxed">
                  We highly encourage you to specify your genuine <strong>Instagram user ID (e.g. @julia_tastes or @happy_couple)</strong> is written down! This builds happy social interactions. Other teahouse guests will tap your card and natively discover your aesthetic profile to follow your life, while the café owner gets internet word-of-mouth fame!
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-sm font-mono">
                  🚨 {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-[11px] rounded-sm font-mono flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600 animate-bounce" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column values */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-widest text-[#1B2820] block font-mono">
                      Your Name or Instagram Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. @cozy_escapes or Elena & Liam"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full text-xs font-serif bg-[#FDFAF4] border border-[#C8DFC0] p-2.5 rounded-sm focus:outline-none focus:border-[#C4924A] text-[#1B2820]"
                    />
                    <p className="text-[8px] text-[#C4924A] font-mono leading-relaxed mt-1">
                      💡 <strong>Instagram User ID Boost:</strong> Enter your Instagram username (e.g. <code>julia_tastes</code> or <code>@julia_tastes</code>) or any custom nickname. If you input your handle, other guests can click your card to follow you, spreading the love and bringing massive follower reach for both you and the cafe!
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-widest text-[#1B2820] block font-mono">
                      Your Memory Caption & Message * (Max 500 chars)
                    </label>
                    <textarea
                      required
                      rows={4}
                      maxLength={500}
                      placeholder="Celebrated my best friend's birthday here! Staring at the cozy ferns while drinking lavender tea. 🌿🎂"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full text-xs font-serif bg-[#FDFAF4] border border-[#C8DFC0] p-2.5 rounded-sm focus:outline-none focus:border-[#C4924A] resize-none text-[#1B2820]"
                    />
                  </div>
                </div>

                {/* Right Column Custom Photo Choice */}
                <div className="space-y-4 bg-[#F2EBD9] border border-[#C8DFC0] p-4 rounded-sm">
                  <div className="space-y-2">
                    <label className="text-[9.5px] font-bold uppercase tracking-widest text-[#1B2820] block font-mono">
                      Select Photo Source Choice 📸
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePhotoSource('preset')}
                        className={`py-2 px-3 text-[9px] uppercase font-bold tracking-widest font-mono rounded-sm border cursor-pointer text-center duration-200 ${
                          activePhotoSource === 'preset'
                            ? 'bg-[#2E4035] border-[#2E4035] text-[#A8C5A0]'
                            : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#6a8a70] hover:bg-[#F2EBD9]'
                        }`}
                      >
                        Cozy Backdrop Presets
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhotoSource('upload')}
                        className={`py-2 px-3 text-[9px] uppercase font-bold tracking-widest font-mono rounded-sm border cursor-pointer text-center duration-250 ${
                          activePhotoSource === 'upload'
                            ? 'bg-[#2E4035] border-[#2E4035] text-[#A8C5A0]'
                            : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#6a8a70] hover:bg-[#F2EBD9]'
                        }`}
                      >
                        Upload Local Photo
                      </button>
                    </div>
                    {activePhotoSource === 'preset' ? (
                    <div className="space-y-2">
                      <span className="text-[8px] uppercase tracking-widest text-[#6a8a70] font-mono block">
                        Select Aesthetic Backdrop Preset:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {PHOTO_PRESETS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => {
                              setSelectedPhoto(preset.url);
                            }}
                            className={`p-2 border rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-[#FDFAF4] ${
                              selectedPhoto === preset.url
                                ? 'border-[#C4924A] bg-[#F2EBD9] scale-[1.03] shadow-xs ring-1 ring-[#C4924A]/30'
                                : 'border-[#C8DFC0] opacity-75 hover:opacity-100'
                            }`}
                          >
                            <span className="text-md">{preset.icon}</span>
                            <span className="text-[7.5px] tracking-tight truncate w-full text-center mt-1 text-[#6a8a70] font-mono">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[8px] uppercase tracking-widest text-[#6a8a70] font-mono block">
                        Upload Your Own Memory Snapshot File:
                      </span>
                      
                      <div className="relative group border-2 border-dashed border-[#C8DFC0] hover:border-[#C4924A] rounded-sm p-4 text-center bg-[#FDFAF4] cursor-pointer transition-colors duration-250">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setUploadedPhotoBase64(compressed);
                                setErrorMessage('');
                              } catch (err) {
                                console.error(err);
                                setErrorMessage("Could not load or compress image. Please try another photo.");
                              }
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        
                        <div className="flex flex-col items-center justify-center space-y-2">
                          {uploadedPhotoBase64 ? (
                            <div className="relative aspect-square w-16 bg-[#F2EBD9] rounded-xs border border-[#C8DFC0] overflow-hidden shadow-sm">
                              <img src={uploadedPhotoBase64} alt="Upload preview" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-[#1B2820]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-4 h-4 text-[#FDFAF4]" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#F2EBD9] group-hover:bg-[#F2EBD9]/80 group-hover:text-[#C4924A] flex items-center justify-center text-[#6a8a70] transition-colors">
                              <ImageIcon className="w-4.5 h-4.5" />
                            </div>
                          )}
                          <div className="text-[9px] text-[#1B2820]">
                            <span className="font-bold text-[#C4924A] underline group-hover:text-[#9c7134]">Click to browse files</span> or drag & drop image
                          </div>
                          <p className="text-[7px] text-[#6a8a70] font-mono tracking-wider uppercase leading-none">
                            JPG, PNG, WebP (Compressed instantly for real-time memory rendering)
                          </p>
                        </div>
                      </div>

                      {uploadedPhotoBase64 && (
                        <div className="flex items-center gap-1.5 p-2 bg-green-50 border border-green-200/50 rounded-sm text-green-700 text-[8.5px] font-mono leading-none">
                          <Check className="w-3.5 h-3.5" />
                          <span>IMAGE ATTACHED & ACTIVATED BEAUTIFULLY!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-[#C8DFC0] mt-3 gap-3">
                <div>
                  {userExistingMemory && (
                    <div className="flex items-center space-x-2">
                      {!showDeleteConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 border border-red-200 hover:border-red-400 bg-red-50 text-red-700 hover:bg-red-100 rounded-sm text-[9.5px] uppercase tracking-widest font-mono font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete My Post 🗑️</span>
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 p-2 rounded-sm">
                           <span className="text-[8.5px] font-mono text-red-800 font-bold uppercase tracking-wider">
                            Sure? This removes your comment & photo permanently.
                          </span>
                          <button
                            type="button"
                            onClick={handleDeleteMemory}
                            disabled={isDeleting}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xs text-[8.5px] uppercase tracking-wider font-mono font-bold cursor-pointer transition-colors"
                          >
                            {isDeleting ? "Deleting..." : "Yes, Delete!"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-2 py-1 bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] rounded-xs text-[8.5px] uppercase tracking-wider font-mono cursor-pointer hover:bg-[#F2EBD9]"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="px-6 py-2.5 bg-[#2E4035] border border-[#2E4035] hover:bg-[#1B2820] text-[#A8C5A0] rounded-sm text-[9px] uppercase tracking-widest font-mono font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Whispering to Firestore...</span>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>{userExistingMemory ? "Save Changes" : "Pin It Forever"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Wall Grid containing Polaroid cards */}
      <div className="mt-8 relative py-4 bg-[#F2EBD9] rounded-sm p-4 border border-[#C8DFC0] shadow-inner">
        
        {/* String wire hanging line visual for Polaroids */}
        <div className="absolute top-8 left-6 right-6 h-[1.5px] bg-[#C8DFC0] opacity-60 z-0 hidden sm:block" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-2" id="polaroid-grid-section">
          <AnimatePresence mode="popLayout">
            {allMemories.map((memo, idx) => {
              const tiltClass = getTilt(memo.id);
              const isMine = memo.id === myMemoryId;
              
              return (
                <motion.div
                  key={memo.id || `preset-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.04, rotate: 0, y: -4 }}
                  onClick={() => setZoomedMemory(memo)}
                  className={`bg-[#FDFAF4] p-3 pb-6 border rounded-xs shadow-polaroid transform ${tiltClass} cursor-pointer transition-all duration-300 relative group flex flex-col justify-between ${
                    isMine ? 'border-[#C4924A] ring-1 ring-[#C4924A]/15' : 'border-[#C8DFC0]'
                  }`}
                >
                  {/* Adhesive tape strip decoration */}
                  <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-14 h-5 bg-[#F2EBD9]/35 border border-[#C8DFC0]/50 shadow-2xs rotate-1 z-10 pointer-events-none group-hover:scale-90 duration-500" />

                  {/* Owner star tag indicator */}
                  {isMine && (
                    <div className="absolute top-2 right-2 bg-[#C4924A] text-[#FDFAF4] text-[7px] font-bold px-1.5 py-0.5 rounded-xs tracking-widest font-mono z-15 shadow-sm rotate-6 border border-[#FDFAF4]">
                      MY SNAP
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Polaroid Photo aspect */}
                    <div className="aspect-square w-full bg-[#F2EBD9] overflow-hidden rounded-xs border border-[#C8DFC0] relative shadow-inner">
                      <img 
                        src={memo.imageUrl} 
                        alt={`Photo by ${memo.guestName}`} 
                        className="w-full h-full object-cover filter brightness-[0.98] contrast-[1.02] group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#1B2820]/0 group-hover:bg-[#1B2820]/5 transition-colors" />
                    </div>

                    {/* Guest message caption */}
                    <p className="text-[11px] leading-relaxed font-serif text-[#1B2820] line-clamp-3 text-left antialiased px-1 h-12 overflow-hidden">
                      "{memo.caption}"
                    </p>
                  </div>

                  {/* Polaroid label margins */}
                  <div className="pt-3 border-t border-[#C8DFC0] mt-2 flex items-center justify-between text-left shrink-0">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-[#6a8a70] font-mono block leading-none">
                        Guest Voice
                      </span>
                      {isInstagramHandle(memo.guestName) ? (
                        <a 
                          href={getInstagramLink(memo.guestName)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} // Stop zoom promo
                          className="text-[9.5px] font-bold text-[#C4924A] hover:underline flex items-center gap-1 leading-none font-mono"
                        >
                          <Instagram className="w-2.5 h-2.5 text-[#C4924A]" />
                          <span>{memo.guestName}</span>
                        </a>
                      ) : (
                        <span className="text-[9.5px] font-bold text-[#1B2820] font-mono leading-none">
                          {memo.guestName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      {isMine && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Stop zoom promo
                            handleOpenForm();
                          }}
                          className="p-1 border border-[#C8DFC0] bg-[#F2EBD9] hover:border-[#C4924A] rounded-sm text-[#6a8a70] hover:text-[#1B2820] transition-colors cursor-pointer"
                          title="Quick Edit Post"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      
                      {(isMine || isAdmin) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Stop zoom promo
                            handleDeleteMemory(memo.id);
                          }}
                          className="p-1 border border-red-100 bg-red-50 hover:border-red-400 rounded-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          title="Quick Delete Post"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                      
                      <div className="w-6 h-6 rounded-full bg-[#FDFAF4] border border-[#C8DFC0] flex items-center justify-center text-[#6a8a70] group-hover:bg-[#C4924A] group-hover:text-[#FDFAF4] transition-all duration-300">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Visual Indicator of Live database connection */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[8px] tracking-widest font-mono text-[#6a8a70] select-none">
        <span>* 1 ACTIVE MEMORY CARD RESTRICTION IMPLEMENTED PER DEVICE VIA CLIENT ID</span>
        <div className="flex items-center justify-end space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span>CAFE DB PERSISTENCE ONLINE • TOTAL ACTIVE ENTRIES CAP: 10</span>
        </div>
      </div>

      {/* LIGHTBOX ZOOM MODAL */}
      <AnimatePresence>
        {zoomedMemory && (
          <div className="fixed inset-0 bg-[#1B2820]/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="lightbox-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FDFAF4] p-4 pb-8 sm:p-5 sm:pb-10 border border-[#C8DFC0] rounded-xs shadow-2xl relative max-w-md w-full focus:outline-none"
            >
              {/* Top tape-strip adhesive */}
              <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 w-24 h-6 bg-[#F2EBD9]/85 border border-[#C8DFC0] shadow-sm z-30 rotate-1 pointer-events-none" />

              <button
                onClick={() => setZoomedMemory(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-[#F2EBD9] hover:bg-[#C8DFC0] text-[#1B2820] rounded-full flex items-center justify-center cursor-pointer transition-colors z-30"
                type="button"
                title="Close Lightbox"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4 text-left">
                {/* Image layout */}
                <div className="aspect-square bg-[#F2EBD9] overflow-hidden border border-[#C8DFC0] shadow-inner rounded-xs">
                  <img 
                    src={zoomedMemory.imageUrl} 
                    alt={zoomedMemory.guestName}
                    className="w-full h-full object-cover filter brightness-[0.98]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Narrative block */}
                <div className="space-y-3 px-1">
                  <p className="text-xs sm:text-[13px] font-serif leading-relaxed text-[#1B2820] italic">
                    "{zoomedMemory.caption}"
                  </p>

                  <div className="pt-2.5 border-t border-[#C8DFC0] flex items-center justify-between">
                    <div>
                      <span className="text-[8px] uppercase font-mono text-[#6a8a70] block">
                        Written by Premium Guest
                      </span>
                      {isInstagramHandle(zoomedMemory.guestName) ? (
                        <a 
                          href={getInstagramLink(zoomedMemory.guestName)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#C4924A] hover:underline inline-flex items-center space-x-1 font-mono"
                        >
                          <Instagram className="w-3.5 h-3.5 mr-1" />
                          <span>{zoomedMemory.guestName}</span>
                        </a>
                      ) : (
                        <span className="text-xs font-bold text-[#1B2820] font-mono">
                          {zoomedMemory.guestName}
                        </span>
                      )}
                    </div>

                    <span className="text-[9px] bg-[#F2EBD9] px-2 py-1 rounded-sm text-[#6a8a70] font-mono uppercase">
                      Cozy Frame
                    </span>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
