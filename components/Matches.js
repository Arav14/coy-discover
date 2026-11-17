export default function Matches({ matches, onDiscover }) {
  if (matches.length === 0) {
    return (
      <div className="empty">
        <div className="empty-art" aria-hidden="true">💌</div>
        <h2>No matches yet</h2>
        <p>When someone you like likes you back, they'll show up here. Nobody else ever sees your likes.</p>
        <button className="btn" onClick={onDiscover}>Start discovering</button>
      </div>
    );
  }
  return (
    <ul className="matches">
      {matches.map(({ profile, matchedAt }) => (
        <li key={profile.id} className="match-row">
          <img src={profile.photo} alt="" />
          <div>
            <strong>
              {profile.name}, {profile.age}
            </strong>
            <span>{profile.location}</span>
            <time dateTime={matchedAt}>
              Matched {new Date(matchedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </time>
          </div>
        </li>
      ))}
    </ul>
  );
}
