import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, doc, getDoc, setDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHelper';
import { Heart, Compass, PenTool, Sparkles, ScrollText, Users, ExternalLink, MessageCircle, Trash2 } from 'lucide-react';

interface DishReviewsProps {
  dishId: string;
  isAdmin?: boolean;
}

export default function DishReviews({ dishId, isAdmin }: DishReviewsProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [editingReview, setEditingReview] = useState<boolean>(false);

  useEffect(() => {
    let storedDeviceId = localStorage.getItem('deviceId');
    if (!storedDeviceId) {
      storedDeviceId = 'device_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    const storedLike = localStorage.getItem(`hasLiked-${dishId}`);
    setUserLiked(!!storedLike);

    const storedName = localStorage.getItem('guestName');
    if (storedName) setGuestName(storedName);
  }, [dishId]);

  useEffect(() => {
    const statsRef = doc(db, 'dish_stats', dishId);
    const unsubStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setLikesCount(docSnap.data().likesCount || 0);
      } else {
        setLikesCount(0);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `dish_stats/${dishId}`);
    });

    const commentsRef = collection(db, 'dishes', dishId, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
    const unsubComments = onSnapshot(commentsQuery, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setComments(msgs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `dishes/${dishId}/comments`);
    });

    return () => {
      unsubStats();
      unsubComments();
    };
  }, [dishId]);

  const existingComment = comments.find(c => c.userId === deviceId);

  const handleLike = async () => {
    try {
      const statsRef = doc(db, 'dish_stats', dishId);
      const snap = await getDoc(statsRef);
      if (userLiked) {
        if (snap.exists() && (snap.data().likesCount || 0) > 0) {
          await updateDoc(statsRef, { likesCount: increment(-1) });
        }
        setUserLiked(false);
        localStorage.removeItem(`hasLiked-${dishId}`);
      } else {
        if (!snap.exists()) {
          await setDoc(statsRef, { likesCount: 1 });
        } else {
          await updateDoc(statsRef, { likesCount: increment(1) });
        }
        setUserLiked(true);
        localStorage.setItem(`hasLiked-${dishId}`, 'true');
      }
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `dish_stats/${dishId}`);
    }
  };

  const startEdit = () => {
    if (existingComment) {
      setNewComment(existingComment.text);
      setGuestName(existingComment.authorName);
      setEditingReview(true);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const isOwner = comments.find(c => c.id === commentId)?.userId === deviceId;
    if (!isAdmin && !isOwner) {
      alert("Ledger entries are permanent to keep chronicles authentic. Kindly request the Botanical Master to moderate or prune ledger lines! 🌿");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently dissolve this tasting chronicle?")) return;
    try {
      const commentRef = doc(db, 'dishes', dishId, 'comments', commentId);

      // Perform direct database deletion
      await deleteDoc(commentRef);
      
      const statsRef = doc(db, 'dish_stats', dishId);
      const snap = await getDoc(statsRef);
      if (snap.exists() && (snap.data().commentCount || 0) > 0) {
        await updateDoc(statsRef, { commentCount: increment(-1) });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `dishes/${dishId}/comments/${commentId}`);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    let finalName = guestName.trim() || 'Anonymous Connoisseur';
    localStorage.setItem('guestName', finalName);

    try {
      if (existingComment && editingReview) {
        await updateDoc(doc(db, 'dishes', dishId, 'comments', existingComment.id), {
          text: newComment.trim(),
          authorName: finalName
        });
        setEditingReview(false);
      } else if (!existingComment) {
        await addDoc(collection(db, 'dishes', dishId, 'comments'), {
          text: newComment.trim(),
          authorName: finalName,
          userId: deviceId,
          createdAt: serverTimestamp(),
        });
        
        const statsRef = doc(db, 'dish_stats', dishId);
        const snap = await getDoc(statsRef);
        if (!snap.exists()) {
          await setDoc(statsRef, { commentCount: 1, likesCount: likesCount || 0 });
        } else {
          await updateDoc(statsRef, { commentCount: increment(1) });
        }
      }
      setNewComment("");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, `dishes/${dishId}/comments`);
    }
  };

  const isInstagram = (author: string) => {
    return author.trim().startsWith('@');
  };

  const getInstagramUrl = (author: string) => {
    const handle = author.trim().replace(/^@/, '');
    return `https://www.instagram.com/${handle}`;
  };

  return (
    <div className="bg-[#FDFAF4] border border-[#C8DFC0] rounded-md p-5 sm:p-7 text-[#1B2820] text-left relative overflow-hidden shadow-sm" id="premium-guest-diary">
      
      {/* Visual gold top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C4924A] via-[#C8DFC0] to-[#C4924A]" />

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#C8DFC0] pb-5 mb-5 gap-4 relative z-10">
        <div>
          <h4 className="text-sm font-display uppercase font-bold tracking-wider text-[#1B2820] flex items-center gap-1.5">
            <MessageCircle className="w-4.5 h-4.5 text-[#C4924A]" />
            <span>Salon Guest Ledger</span>
          </h4>
          <p className="text-[10px] text-[#6a8a70] font-mono uppercase mt-1 leading-normal tracking-wide">
            Read taste assessments & chronicles recorded from our tables.
          </p>
        </div>

        {/* Counters & premium interactive button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="border border-[#C8DFC0] bg-[#F2EBD9] text-[#1B2820] text-[10px] px-3 py-1.5 rounded-sm font-mono tracking-wider uppercase">
            <span>{comments.length} CHRONICLES</span>
          </div>

          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer rounded-sm border ${
              userLiked 
                ? 'bg-[#2E4035] text-[#A8C5A0] border-[#2E4035] shadow-sm' 
                : 'bg-[#FDFAF4] border-[#C8DFC0] text-[#1B2820] hover:bg-[#F2EBD9]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${userLiked ? 'fill-current text-[#C4924A] scale-110' : 'text-[#6a8a70]'}`} />
            <span>{likesCount} Enjoys</span>
          </button>
        </div>
      </div>

      {/* Comments display logs */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 relative z-10 scrollbar-thin">
        {comments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-[#C8DFC0] bg-[#F2EBD9] rounded-sm flex flex-col items-center justify-center">
            <span className="text-2xl text-[#6a8a70] mb-1">✍︎</span>
            <p className="text-[10px] font-bold uppercase text-[#1B2820] tracking-wider font-display">
              NO ENTRIES SCRIBED YET
            </p>
            <span className="text-[10px] text-[#6a8a70] uppercase mt-1 font-mono">
              Be the first to record your tasting experience on this piece.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
            {comments.map((c) => (
              <div 
                key={c.id} 
                className="bg-[#FDFAF4] text-[#1B2820] border border-[#C8DFC0] rounded-sm p-4 flex flex-col justify-between transition-all duration-300 hover:border-[#C4924A] shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-[#C8DFC0] pb-2">
                    {isInstagram(c.authorName) ? (
                      <a 
                        href={getInstagramUrl(c.authorName)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#F2EBD9] hover:bg-[#C8DFC0] text-[#C4924A] font-semibold px-2.5 py-1 rounded-sm text-[9.5px] uppercase tracking-wider inline-flex items-center space-x-1 border border-[#C8DFC0]"
                      >
                        <span className="inline-block w-1 h-1 bg-[#C4924A] rounded-full animate-ping mr-1" />
                        <span>📸 {c.authorName}</span>
                        <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-70" />
                      </a>
                    ) : (
                      <span className="bg-[#F2EBD9] text-[#1B2820] font-bold px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-wider border border-[#C8DFC0]">
                        ✦ {c.authorName}
                      </span>
                    )}

                    <div className="flex items-center space-x-2">
                      {c.createdAt && (
                        <span className="text-[#6a8a70] text-[10px] font-mono">
                          {new Date(c.createdAt.toDate?.() || Date.now()).toLocaleDateString()}
                        </span>
                      )}
                      {(c.userId === deviceId || isAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1 border border-[#C8DFC0] bg-red-50 hover:bg-red-100 rounded-sm text-[#C4924A] hover:text-red-700 transition-colors cursor-pointer"
                          title="Delete Chronicle"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[#1B2820] font-serif text-sm leading-relaxed italic pl-1 text-left">
                    "{c.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Scribe Form */}
      <div className="pt-5 border-t border-[#C8DFC0] mt-5 relative z-10">
        {existingComment && !editingReview ? (
          <div className="flex flex-col items-center justify-center p-5 bg-[#F2EBD9] border border-dashed border-[#C8DFC0] text-center rounded-sm">
            <p className="text-[10px] text-[#C4924A] font-bold uppercase mb-3 tracking-wider font-display">
              Your tasting chronicle is permanently glowing on this selection.
            </p>
            <button 
              onClick={startEdit} 
              className="text-[10px] uppercase font-bold tracking-widest text-[#C4924A] bg-[#FDFAF4] hover:bg-[#F2EBD9] border border-[#C8DFC0] rounded-sm px-5 py-2.5 transition-all cursor-pointer shadow-sm"
              type="button"
            >
              Update Your Tasting Memoir
            </button>
          </div>
        ) : (
          <form onSubmit={handlePostComment} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3 flex flex-col space-y-1">
                <label htmlFor="stencil-author" className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider text-left block font-display">
                  Scribe Handle / Name
                </label>
                <input 
                  id="stencil-author"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. @InstaHandle or Name"
                  maxLength={30}
                  className="w-full bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] placeholder-[#6a8a70] focus:outline-none focus:border-[#C4924A] py-2.5 px-4 text-xs rounded-sm font-sans"
                />
              </div>

              <div className="flex-1 flex flex-col space-y-1">
                <label htmlFor="stencil-text" className="text-[10px] uppercase font-bold text-[#6a8a70] tracking-wider text-left block font-display">
                  {editingReview ? "Amend Your Chronicle" : "Tasting Memoir & Review"}
                </label>
                <div className="flex gap-2">
                  <input 
                    id="stencil-text"
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={editingReview ? "Edit note of sweet visit..." : "e.g. 'Matcha cloud foam is incredibly airy. Pure perfection!'" }
                    maxLength={150}
                    className="flex-1 bg-[#FDFAF4] border border-[#C8DFC0] text-[#1B2820] placeholder-[#6a8a70] focus:outline-none focus:border-[#C4924A] py-2.5 px-4 text-xs rounded-sm font-sans"
                  />
                  {editingReview && (
                    <button 
                      type="button" 
                      onClick={() => { setEditingReview(false); setNewComment(""); }} 
                      className="bg-[#FDFAF4] text-[#1B2820] hover:text-[#1B2820] border border-[#C8DFC0] rounded-sm px-3 text-xs cursor-pointer"
                    >
                      X
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-[#2E4035] hover:bg-[#1B2820] disabled:opacity-35 disabled:cursor-not-allowed text-[#A8C5A0] font-bold px-6 py-2.5 text-[10px] rounded-sm uppercase tracking-wider transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    {editingReview ? "UPDATE" : "RECORD ✒️"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
