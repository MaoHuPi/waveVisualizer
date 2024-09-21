/*
 * Exist @ 2024
 */

import renderMotion from './renderMotion.mjs';

// renderMotion({
// 	name: 'test',
// 	laserHue: 0, 
// 	callMakeVideo: true,

// 	outputScale: 0.5, 
// 	pathScale: 0.1, 

// 	width: 1920, 
// 	height: 1080, 
// 	length: 1.5e3 / 1e3,
// 	fps: 30,
// 	updateTimeout: 300 / 1e3,

// 	renderQueue: [
// 		{
// 			src: 'data/star.json', timeSpan: 1e3 / 1e3, updateTimeout: 0.1
// 		}
// 	]
// });

let [cx, cy] = [1920, 1080].map(n => n * 0.5 / 2);
let r = 100;
// let path = new Array(100 * 10).fill(0).map((n, i) => [cx + r * (i / 1000) * Math.cos(i / 100 * Math.PI * 2), cy + r * (i / 1000) * -Math.sin(i / 100 * Math.PI * 2)]);
let path = new Array(1e3).fill(0).map((n, i) => [cx + r * Math.sin(i / 1e3 * 14 * Math.PI * 2) * Math.cos(i / 1e3 * 9 * Math.PI * 2), cy + r * Math.sin(i / 1e3 * 14 * Math.PI * 2) * -Math.sin(i / 1e3 * 9 * Math.PI * 2)]);
renderMotion({
	name: 'test',
	laserHue: 120,
	callMakeVideo: true,

	outputScale: 0.5,
	pathScale: 0.5,

	width: 1920,
	height: 1080,
	length: 2e3 / 1e3,
	fps: 30,
	updateTimeout: 300 / 1e3,

	renderQueue: [
		{
			path: path, timeSpan: 2e3 / 1e3, updateTimeout: 300 / 1e3
		}
	]
});