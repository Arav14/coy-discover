"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function MatchModal({ match, onClose, onViewMatches }) {
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.7, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 18 } }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 id="match-title" className="match-title">It's a match!</h2>
            <p>You and {match.profile.name} liked each other.</p>
            <div className="match-avatars">
              <div className="avatar you" aria-label="You">You</div>
              <span className="heart" aria-hidden="true">❤</span>
              <img className="avatar" src={match.profile.photo} alt={match.profile.name} />
            </div>
            <button className="btn" onClick={onViewMatches}>See matches</button>
            <button className="link light" onClick={onClose} autoFocus>Keep swiping</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
