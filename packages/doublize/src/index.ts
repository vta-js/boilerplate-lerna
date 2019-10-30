import delay from "@vta/delay";

export default function doublize(seed: number): Promise<number> {
  return delay(100).then(() => seed * 2);
}
