export default function PlayDistanceSound(distance: number, audioTrack: string, volume: number) {
	emitNet("sawu_sounds:server:PlayWithinDistance", distance, audioTrack, volume);
}
