"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";

const SWIPE_DISTANCE = 110; // px
const SWIPE_VELOCITY = 500; // px/s

export const cardVariants = {
  enter: { scale: 0.94, y: 14, opacity: 0 },
  center: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.25 } },
  behind: { scale: 0.94, y: 14, opacity: 1, transition: { duration: 0.25 } },
  exit: (dir) => ({
    x: dir * 520,
    rotate: dir * 24,
    opacity: 0,
    transition: { duration: 0.32, ease: [0.4, 0, 0.6, 1] },
  }),
};

export default function SwipeCard({ profile, isTop, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-16, 16]);
  const likeOpacity = useTransform(x, [25, SWIPE_DISTANCE], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_DISTANCE, -25], [1, 0]);

  function handleDragEnd(_, info) {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) onSwipe("like");
    else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) onSwipe("pass");
    // Otherwise dragSnapToOrigin springs it back.
  }

  return (
    <motion.article
      className="card"
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      variants={cardVariants}
      initial="enter"
      animate={isTop ? "center" : "behind"}
      exit="exit"
      drag={isTop ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
      aria-hidden={!isTop}
      aria-label={isTop ? `${profile.name}, ${profile.age}` : undefined}
    >
      <img className="card-photo" src={profile.photo} alt="" draggable={false} />
      <motion.div className="stamp stamp-like" style={{ opacity: likeOpacity }}>LIKE</motion.div>
      <motion.div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>NOPE</motion.div>
      <div className="card-info">
        <h2>
          {profile.name}, <span className="age">{profile.age}</span>
        </h2>
        <p className="loc">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
          </svg>
          {profile.location}
        </p>
        <p className="bio">{profile.bio}</p>
        <ul className="chips">
          {profile.interests.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}
