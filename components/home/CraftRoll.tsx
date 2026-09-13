/** The scrolling band of craft names under the hero. */
export default function CraftRoll() {
  const names = [
    ["Blue Pottery", "hi"], ["मीनाकारी", "st-dv"], ["Bagru Block", ""],
    ["Lac & Brass", "hi"], ["संगमरमर जाली", "st-dv"], ["Kathputli", ""],
  ];
  return (
    <div className="st-roll" aria-hidden="true">
      <ul>
        {[...names, ...names].map(([name, cls], i) => (
          <li key={i} className={cls}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
