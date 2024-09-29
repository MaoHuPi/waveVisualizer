/*
 * Exist @ 2024
 */

import fs from 'node:fs';
import { createCanvas } from 'canvas';
import { execSync } from 'child_process';
import { hsl2rgb } from "./hslrgb.mjs";

let sampleRectR = 2;

function lineTo(data, [sx, sy], [ex, ey]) {
	let [height, width] = [data.length, data[0].length];
	let minX = Math.min(sx, ex),
		maxX = Math.max(sx, ex),
		minY = Math.min(sy, ey),
		maxY = Math.max(sy, ey);
	for (let y = minY; y < maxY; y++) {
		let x = Math.round(-(ey - y) * (ex - sx) / (ey - sy) + ex);
		if (0 <= y && y < height && 0 <= x && x < width)
			data[y][Math.round(x)] = 1;
	}
	for (let x = minX; x < maxX; x++) {
		let y = Math.round(-(ey - sy) * (ex - x) / (ex - sx) + ey);
		if (0 <= y && y < height && 0 <= x && x < width)
			data[Math.round(y)][x] = 1;
	}
}

function inR(R, r) {
	return (d => d == 0 ? 0 : d <= R ? 1 / (2 * Math.PI * R) * r : 0);
}
function near(a, n) {
	return (d => d == 0 ? 0 : a * (1 / (d ** n)));
}

function update(data, distanceToCoefficient) {
	let [height, width] = [data.length, data[0].length];
	let data2 = new Array(height).fill(0).map(() => new Array(width).fill(0));
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			let sum = 0;
			for (let r2 = Math.max(r - sampleRectR, 0); r2 < Math.min(r + sampleRectR, height); r2++) {
				for (let c2 = Math.max(c - sampleRectR, 0); c2 < Math.min(c + sampleRectR, width); c2++) {
					sum += distanceToCoefficient(Math.sqrt((r2 - r) ** 2 + (c2 - c) ** 2)) * data[r2][c2];
				}
			}
			data2[r][c] = Math.min(Math.max(sum, 0), 1);
		}
	}
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			data[r][c] = data2[r][c];
		}
	}
}

function render(cvs, data, laserHue) {
	const ctx = cvs.getContext('2d');
	for (let r = 0; r < cvs.height; r++) {
		for (let c = 0; c < cvs.width; c++) {
			// ctx.fillStyle = `hsl(0deg, 50%, ${data[r][c] * 100 * 10}%)`;
			let value = Math.floor(Math.min(data[r][c] * 100 * 10, 100));
			ctx.fillStyle = `rgb(${hsl2rgb(
				laserHue / 360,
				100 / 100,
				value / 100
			).join(', ')})`;
			ctx.fillRect(c, r, 1, 1);
		}
	}
}

function writeImage(name, cvs) {
	return new Promise((resolve) => {
		const out = fs.createWriteStream(name);
		const stream = cvs.createPNGStream();
		stream.pipe(out);
		out.on('finish', resolve);
	});
}

export default async function renderMotion({
	name, laserHue, callMakeVideo,
	outputScale, pathScale,
	width, height, length, fps, updateTimeout, renderQueue
}) {
	if (!fs.existsSync(`./out/`)) fs.mkdirSync(`./out/`);
	if (!fs.existsSync(`./out/${name}/`)) fs.mkdirSync(`./out/${name}/`);

	[width, height] = [width, height].map(n => n * outputScale);
	let scale = pathScale / outputScale;
	let cvs = createCanvas(width, height);
	let data = new Array(height).fill(0).map(() => new Array(width).fill(0));

	let globalFrame = 0;
	let lastUpdateTimes = 0;
	function drawPath(path, startAt, timeSpan) {
		let lastIndex = 0;
		let startTime = globalFrame / fps;
		let done = false;
		function update() {
			if (done) return;
			let currentTime = globalFrame / fps;
			if (currentTime - startTime < startAt) return;
			let targetIndex = Math.max(Math.floor((currentTime - (startTime + startAt)) / timeSpan * path.length), 0);
			for (let i = lastIndex; i < targetIndex; i++) {
				if (i + 1 <= path.length - 1) lineTo(data, path[i].map(n => Math.round(n * (1 / scale))), path[i + 1].map(n => Math.round(n * (1 / scale))));
			}
			lastIndex = targetIndex;
			if (currentTime - startTime > startAt + timeSpan) done = true;
		}
		return update;
	}

	for (let item of renderQueue) {
		if ('src' in item && item.src) {
			item.path = JSON.parse(fs.readFileSync(item.src, 'utf8'));
		}
		if (item.startAt === undefined) item.startAt = 0;
		item.update = drawPath(item.path, item.startAt, item.timeSpan);
	}

	for (let frame = 0; frame < length * fps; frame++) {
		globalFrame = frame;
		// update(draw) queue item
		for (let item of renderQueue) {
			item.update();
		}
		// update data
		let targetUpdateTimes = (frame / fps) / updateTimeout;
		let currentUpdateTimes = Math.max(targetUpdateTimes - lastUpdateTimes, 0);
		for (let _ = 0; _ < currentUpdateTimes; _++) {
			update(data, inR(3, 1));
		}
		lastUpdateTimes = targetUpdateTimes;
		// render and save
		render(cvs, data, laserHue);
		await writeImage(`./out/${name}/frame_${frame}.png`, cvs);
	}

	if (callMakeVideo) {
		execSync(`"./makeVideo.bat" "${name}" ${fps}`);
	}
}