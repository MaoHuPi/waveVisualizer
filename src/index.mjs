/*
 * Exist @ 2024
 */

import fs from 'node:fs';
import renderMotion from './renderMotion.mjs';
import { loadImage } from 'canvas';
import { analyzePathFromImage, analyzeTurningPointOfPath, getPathFromSvg } from './pathProcess.mjs';

let motion = {
	test_star: () => {
		renderMotion({
			name: 'test',
			laserHue: 0,
			callMakeVideo: true,

			outputScale: 0.5,
			pathScale: 0.1,

			width: 1920,
			height: 1080,
			length: 1.5e3 / 1e3,
			fps: 30,
			updateTimeout: 300 / 1e3,

			renderQueue: [
				{
					src: 'data/star.json', timeSpan: 1e3 / 1e3, updateTimeout: 0.1
				}
			]
		});
	}
	,
	test_sineStar: () => {
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
	}
	,
	catAndPath: async () => {
		let image = await loadImage('image/cat.png');

		/* analize currently */
		// let path = (await analyzePathFromImage({
		// 	image: image
		// })).sort((a, b) => b.length - a.length)[2].pointList;
		// console.log(analyzeTurningPointOfPath(path, 2e2));
		/* save path result */
		// fs.writeFile('data/cat.json', JSON.stringify(
		// 	(await analyzePathFromImage({
		// 		image: await loadImage('image/cat.png')
		// 	})).sort((a, b) => b.length - a.length)[2].pointList
		// ), err => {
		// 	if (err) console.error(err);
		// });
		/* load path result */
		let path = JSON.parse(await fs.readFileSync('data/cat.json', 'utf8'));

		let turningPointData = analyzeTurningPointOfPath(path, 50);
		console.log(turningPointData);
		let turningPoint = turningPointData.anticlockwise2clockwise[13];
		if (turningPoint !== undefined) path = path.splice(0, turningPoint);
		renderMotion({
			name: 'catAndPath',
			laserHue: 120,
			callMakeVideo: true,

			outputScale: 0.5,
			pathScale: image.height / 1080,

			width: 1920,
			height: 1080,
			length: 2e3 / 1e3,
			fps: 30,
			updateTimeout: 300 / 1e3,

			renderQueue: [
				{
					path: path, startAt: 0.0e3 / 1e3, timeSpan: 0.5e3 / 1e3, updateTimeout: 300 / 1e3
				},
				{
					path: path, startAt: 0.5e3 / 1e3, timeSpan: 0.5e3 / 1e3, updateTimeout: 300 / 1e3
				},
				{
					path: path, startAt: 1.0e3 / 1e3, timeSpan: 0.5e3 / 1e3, updateTimeout: 300 / 1e3
				},
				{
					path: path, startAt: 1.5e3 / 1e3, timeSpan: 0.5e3 / 1e3, updateTimeout: 300 / 1e3
				}
			]
		});
		// renderMotion({
		// 	name: 'catAndPath',
		// 	laserHue: 120,
		// 	callMakeVideo: false,

		// 	outputScale: 0.5,
		// 	pathScale: image.height / 1080,

		// 	width: 1920,
		// 	height: 1080,
		// 	length: 2,
		// 	fps: 1,
		// 	updateTimeout: 1,

		// 	renderQueue: [
		// 		{
		// 			path: path, startAt: 0, timeSpan: 1, updateTimeout: 1
		// 		}
		// 	]
		// });
	}
	,
	hbd: async () => {
		let pathList = await getPathFromSvg({ svg: 'image/hbd.svg' });
		renderMotion({
			name: 'hbd',
			laserHue: 120,
			callMakeVideo: true,

			outputScale: 0.5,
			pathScale: 1,

			width: 1080,
			height: 1080,
			length: 6,
			fps: 30,
			updateTimeout: 0.3,

			renderQueue: [
				...new Array(45).fill(0).map((n, i) =>
					pathList.map(path => ({
						path: path, startAt: i * (4.5 / 45), timeSpan: 0.5, updateTimeout: 0.3
					}))
				).reduce((s, n) => s ? [...s, ...n] : n)
			]
		});
	}
};

motion.hbd();