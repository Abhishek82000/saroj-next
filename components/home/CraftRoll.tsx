/** The scrolling band of craft names under the hero. */
export default function CraftRoll() {
  const names = [
    ["Ajrakh", "hi"], ["कलमकारी", "st-dv"], ["Hakoba & Dobby", ""],
    ["Flower Garden Collection", "hi"], ["जुगलबंदी", "st-dv"], ["Jaipuri Cotton", ""],
  ];
  return (
    <div className="st-roll mb-5" aria-hidden="true">
      <ul>
        {[...names, ...names].map(([name, cls], i) => (
          <li key={i} className={cls}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
