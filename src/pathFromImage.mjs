/*
 * Exist @ 2024
 */

import fs from 'node:fs';
import { createCanvas, loadImage } from 'canvas';

export default async function pathFromImage({
	image,
	renderPathImage = false,
}) {
	if (typeof image == 'string') image = await loadImage(image);
	let cvs = createCanvas(image.width, image.height),
		ctx = cvs.getContext('2d');
	ctx.drawImage(image, 0, 0);
	let data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
	let dataState = new Array(data.length / 4).fill(false);
	let pathList = [];
	let threshold = 255;
	for (let i = 0; i < data.length; i += 4) {
		if (dataState[i / 4] == false) {
			dataState[i / 4] = true;
			let color = [data[i], data[i + 1], data[i + 2]];
			// let color = [0, 0, 0];
			// if (color.map((n, index) => Math.abs([0, 0, 0][index] - n)).reduce((s, n) => s + n) > 100) continue;
			let path = [i / 4];
			let previousPointList = [i / 4];
			pathList.push({ color: color, path: path });
			let lastN = i / 4;
			while (true) {
				let neighborCounter = 0;
				for (let j of [
					-1,
					-1 - cvs.width,
					-cvs.width,
					-cvs.width + 1,
					1,
					1 + cvs.width,
					cvs.width,
					cvs.width - 1,
				]) {
					let currentN = lastN + j;
					if (currentN >= 0 &&
						currentN < dataState.length &&
						(Math.abs(j) != 1 || Math.floor(lastN / cvs.width) == Math.floor(currentN / cvs.width)) &&
						dataState[currentN] == false
					) {
						if (color.map((n, index) => Math.abs(data[currentN * 4 + index] - n)).reduce((s, n) => s + n) <= threshold) {
							dataState[currentN] = true;
							path.push(currentN);
							previousPointList.push(currentN);
							neighborCounter++;
							lastN = currentN;
							// break;
						}
					}
				}
				if (neighborCounter == 0) {
					if (previousPointList.length > 1) {
						lastN = previousPointList.pop();
					} else {
						break;
					}
				}
			}
		}
	}


	let filteredPathList = pathList
		.map(({ color, path }, index) => ({
			length: path.length,
			index: index,
			color: color,
			pointList: path.map(n => [n % cvs.width, Math.floor(n / cvs.width)])
		}))
	// .filter(data => data.length > 2 && data.length < (cvs.width * cvs.height) * 6.5e-2)
	// .filter(data => data.length > 2)
	// .sort((a, b) => b.length - a.length)
	// .splice(0, 20);

	console.log(filteredPathList.length, cvs.width * cvs.height);

	if (renderPathImage) {
		function writeImage(name, cvs) {
			return new Promise((resolve) => {
				const out = fs.createWriteStream(name);
				const stream = cvs.createPNGStream();
				stream.pipe(out);
				out.on('finish', resolve);
			});
		}
		ctx.fillStyle = 'pink';
		ctx.fillRect(0, 0, cvs.width, cvs.height);
		for (let i = 0; i < filteredPathList.length; i++) {
			/* coloring as random color */
			// ctx.fillStyle = `rgb(${new Array(3).fill(0).map(n => Math.floor(Math.random() * 255)).join(',')})`;
			/* coloring as original color */
			ctx.fillStyle = `rgb(${filteredPathList[i].color.join(',')})`;

			for (let point of filteredPathList[i].pointList) {
				ctx.fillRect(point[0], point[1], 1, 1);
			}
		}
		writeImage(`image/path.jpg`, cvs);
	}

	return filteredPathList;
}