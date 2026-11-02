import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { Review } from '../types/index.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.js';
import { Button } from '../components/ui/button.js';
import { Badge } from '../components/ui/badge.js';
import { formatDate } from '../lib/utils.js';
import { Star, ShieldCheck, Heart, Send, Sparkles } from 'lucide-react';

const SAFETY_TAGS = [
  'Safe Driving Speed',
  'Clean Helmet Provided',
  'Punctual at Curbside Node',
  'Smooth Braking & Turns',
  'Polite & Respectful',
  'No Phone Use While Riding',
  'Great Conversation',
];

export const Reviews: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const bookingId = searchParams.get('bookingId');
  const targetUserId = searchParams.get('userId') || user?.id;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Safe Driving Speed',
    'Clean Helmet Provided',
  ]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch reviews for target user
  const { data: userReviews, isLoading, refetch } = useQuery<Review[]>({
    queryKey: ['userReviews', targetUserId],
    queryFn: () => (targetUserId ? api.getUserReviews(targetUserId) : Promise.resolve([])),
    enabled: !!targetUserId,
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) {
      alert('Missing booking ID for review submission');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitReview({
        bookingId,
        rating,
        safetyTags: selectedTags,
        comment,
      });
      setSubmitted(true);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Commuter Ratings & Safety Reviews
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Two-way mutual feedback ensures trust, safe road behavior, and helmet compliance
        </p>
      </div>

      {/* Review Submission Card (if bookingId provided) */}
      {bookingId && !submitted && (
        <Card className="glass-panel border-emerald-500/30 p-6 space-y-5">
          <div>
            <Badge variant="secondary" className="gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Post-Trip Safety Feedback</span>
            </Badge>
            <h3 className="text-lg font-bold text-white">How was your bike pool experience?</h3>
            <p className="text-xs text-slate-400">Rate your co-commuter's punctuality, road safety, and behavior</p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Interactive Stars */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Star Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold text-amber-400">{rating}.0 / 5.0</span>
              </div>
            </div>

            {/* Safety Badges */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Commendations & Safety Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {SAFETY_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'glass-card text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Written Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share more details about helmet hygiene, route punctuality, or smooth riding..."
                className="w-full p-3 rounded-xl glass-input text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={submitting}>
              <Send className="w-4 h-4" />
              <span>Submit Verified Review</span>
            </Button>
          </form>
        </Card>
      )}

      {submitted && (
        <Card className="p-6 text-center space-y-2 border-emerald-500/30">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Review Submitted!</h3>
          <p className="text-xs text-slate-400">
            Thank you for helping keep the TwoShare community safe, trustworthy, and verified.
          </p>
        </Card>
      )}

      {/* Public Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Recent Community Reviews</h3>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : userReviews && userReviews.length > 0 ? (
          <div className="space-y-3">
            {userReviews.map((rev) => (
              <Card key={rev.id} className="p-5 border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-xs">
                      {rev.reviewer?.fullName.slice(0, 2).toUpperCase() || 'CM'}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-white">{rev.reviewer?.fullName || 'Verified Commuter'}</span>
                      <span className="text-[10px] text-slate-500 block">{formatDate(rev.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span className="font-bold text-xs">{rev.rating}.0</span>
                  </div>
                </div>

                {rev.safetyTags && rev.safetyTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.safetyTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {rev.comment && <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-xs text-slate-500">
            No public reviews recorded yet. Complete trips to build mutual reputation scores.
          </Card>
        )}
      </div>
    </div>
  );
};
