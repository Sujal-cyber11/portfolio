import styles from "./NeuronBackdrop.module.css";

const nodes = [
  { x: 100, y: 120, r: 4 },
  { x: 240, y: 220, r: 2.5 },
  { x: 360, y: 170, r: 3 },
  { x: 470, y: 280, r: 4.5 },
  { x: 610, y: 220, r: 2.5 },
  { x: 300, y: 360, r: 3 },
  { x: 460, y: 430, r: 5 },
  { x: 620, y: 390, r: 3 },
  { x: 760, y: 310, r: 4 },
  { x: 870, y: 220, r: 3 },
  { x: 980, y: 340, r: 4.5 },
  { x: 1080, y: 260, r: 2.5 },
  { x: 1180, y: 380, r: 4 },
  { x: 1080, y: 500, r: 5 },
  { x: 920, y: 560, r: 3 },
  { x: 760, y: 620, r: 4 },
  { x: 600, y: 560, r: 3 },
  { x: 500, y: 700, r: 4.5 },
  { x: 760, y: 780, r: 3 },
  { x: 920, y: 730, r: 2.5 },
  { x: 1080, y: 690, r: 4 },
  { x: 1220, y: 600, r: 5 },
  { x: 1340, y: 480, r: 3 },
  { x: 1440, y: 600, r: 4 },
  { x: 1360, y: 750, r: 2.5 },
  { x: 1200, y: 840, r: 4 },
  { x: 1040, y: 880, r: 3 },
  { x: 860, y: 900, r: 4.5 },
];

const links: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [2, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 3],
  [4, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [12, 6],
  [12, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [16, 17],
  [17, 9],
  [17, 18],
  [18, 19],
  [19, 20],
  [20, 21],
  [21, 13],
  [21, 22],
  [22, 23],
  [23, 24],
  [24, 25],
  [25, 26],
  [26, 27],
  [27, 18],
  [1, 6],
  [3, 10],
  [8, 14],
  [16, 22],
];

export function NeuronBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <svg
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 1000"
      >
        <g className={styles.links}>
          {links.map(([fromIndex, toIndex]) => {
            const from = nodes[fromIndex];
            const to = nodes[toIndex];

            if (!from || !to) {
              return null;
            }

            return (
              <line
                key={`${fromIndex}-${toIndex}`}
                x1={from.x}
                x2={to.x}
                y1={from.y}
                y2={to.y}
              />
            );
          })}
        </g>
        <g className={styles.nodes}>
          {nodes.map((node, index) => (
            <circle
              className={index % 4 === 0 ? styles.activeNode : styles.node}
              cx={node.x}
              cy={node.y}
              key={`${node.x}-${node.y}`}
              r={node.r}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
