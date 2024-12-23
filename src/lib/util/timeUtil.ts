import { readable } from 'svelte/store';

export const time = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

export const calcProgressRate = (now: Date, next: Date, previous: Date) => {
	return (
		(new Date(now).getTime() - new Date(previous).getTime()) /
		(new Date(next).getTime() - new Date(previous).getTime())
	);
};
