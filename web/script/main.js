const cvs = document.getElementById('cvs'),
	ctx = cvs.getContext('2d');

[width, height] = [1920, 1080].map(n => n * 0.1);
[cvs.width, cvs.height] = [width, height];

let data = new Array(height).fill(0).map(() => new Array(width).fill(0));
let sampleRectR = 2;
function update(distanceToCoefficient) {
	let data2 = new Array(height).fill(0).map(() => new Array(width).fill(0));
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			sum = 0;
			for (let r2 = Math.max(r - sampleRectR, 0); r2 < Math.min(r + sampleRectR, height); r2++) {
				for (let c2 = Math.max(c - sampleRectR, 0); c2 < Math.min(c + sampleRectR, width); c2++) {
					sum += distanceToCoefficient(Math.sqrt((r2 - r) ** 2 + (c2 - c) ** 2)) * data[r2][c2];
				}
			}
			data2[r][c] = Math.min(Math.max(sum, 0), 1);
		}
	}
	data = data2;
}
function render() {
	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			ctx.fillStyle = `hsl(0deg, 50%, ${data[r][c] * 100 * 10}%)`;
			ctx.fillRect(c, r, 1, 1);
		}
	}
}

function inR(R, r) {
	return (d => d == 0 ? 0 : d <= R ? 1 / (2 * Math.PI * R) * r : 0);
}
function near(a, n) {
	return (d => d == 0 ? 0 : a * (1 / (d ** n)));
}

function loop() {
	update(inR(3, 1));
	// update(near(0.4, 5.5));
	render();
	setTimeout(loop, 30);
}
loop();

function lineTo([sx, sy], [ex, ey]) {
	minX = Math.min(sx, ex);
	maxX = Math.max(sx, ex);
	minY = Math.min(sy, ey);
	maxY = Math.max(sy, ey);
	for (let y = minY; y < maxY; y++) {
		let x = -(ey - y) * (ex - sx) / (ey - sy) + ex;
		data[y][Math.round(x)] = 1;
	}
	for (let x = minX; x < maxX; x++) {
		let y = -(ey - sy) * (ex - x) / (ex - sx) + ey;
		data[Math.round(y)][x] = 1;
	}
}

function drawPath(path, timeSpan, updateTimeout) {
	let lastIndex = 0;
	let startTime = Date.now();
	function update() {
		let currentTime = Date.now();
		let targetIndex = Math.max(Math.floor((currentTime - startTime) / timeSpan * path.length), 0);
		for (let i = lastIndex; i < targetIndex; i++) {
			if (i + 1 <= path.length - 1) lineTo(path[i], path[i + 1]);
		}
		lastIndex = targetIndex;
		if (currentTime - startTime < timeSpan) setTimeout(update, updateTimeout);
	}
	update();
}
function playPathFile(url, timeSpan, updateTimeout){
	fetch(url).then(f => f.json()).then(json => {
		drawPath(json, timeSpan, updateTimeout);
	});
}

let [mx, my] = [0, 0];
let recordPath = [];
let recordFlag = false;
cvs.addEventListener('mousedown', event => {
	recordFlag = true;
	recordPath = [];
	[mx, my] = [event.pageX, event.pageY];
})
cvs.addEventListener('mouseup', event => {
	recordFlag = false;
	[mx, my] = [event.pageX, event.pageY];
})
cvs.addEventListener('mousemove', event => {
	if (recordFlag) {
		// data[event.pageY][event.pageX] += 1;
		[tempX, tempY] = [mx, my];
		[mx, my] = [event.pageX, event.pageY];
		recordPath.push([mx, my]);
		lineTo([tempX, tempY], [event.pageX, event.pageY]);
	}
});

playPathFile('data/love.json', 0.01e3, 0.1);