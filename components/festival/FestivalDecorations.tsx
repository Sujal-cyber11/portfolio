const diyas = Array.from({ length: 6 }, (_, index) => index);

export function FestivalDecorations() {
  return (
    <div className="festival-decoration" aria-hidden="true">
      {diyas.map((diya) => (
        <span className="diya" key={diya} />
      ))}
    </div>
  );
}
