/*
 * This code was download from :
 * http://www.leven.ch/canvas/perspective.html
 */

function transformCanvas(srcCanvas, TLdx, TLdy, BLdx, BLdy, BRdx, BRdy, TRdx, TRdy, interpolationMethod) {

	var p1 = {x: 0, y: 0}; // upper left corner
	var p2 = {x: 0, y: (srcCanvas.height)}; // lower left corner
	var p3 = {x: srcCanvas.width, y: (srcCanvas.height)}; // lower right corner
	var p4 = {x: srcCanvas.width, y: 0}; // upper right corner
	


	var q1 = {x: p1.x+TLdx, y: p1.y+TLdy}; // upper left corner
	var q2 = {x: p2.x+BLdx, y: p2.y+BLdy}; // lower left corner
	var q3 = {x: p3.x+BRdx, y: p3.y+BRdy}; // lower right corner
	var q4 = {x: p4.x+TRdx, y: p4.y+TRdy}; // upper right corner
	



	//////////////////////////////////////////////////////////
	// get the dimensions of the transformed image
	var min = {};
	var max = {};

	min.x = Math.min(q1.x, q2.x, q3.x, q4.x);
	min.y = Math.min(q1.y, q2.y, q3.y, q4.y);
	max.x = Math.max(q1.x, q2.x, q3.x, q4.x);
	max.y = Math.max(q1.y, q2.y, q3.y, q4.y);
	//alert('min.x: '+min.x+'\nmin.y: '+min.y+'\nmax.x: '+max.x+'\nmax.y: '+max.y)

	var offsetX = -Math.floor(min.x);
	var offsetY = -Math.floor(min.y);
	//alert('offset\n'+offsetX+'   '+offsetY)

	var destWidth = Math.ceil(Math.abs(max.x - min.x));
	var destHeight = Math.ceil(Math.abs(max.y - min.y));
	
	var destArea = destWidth*destHeight;
	/*if (destArea > 1e5) {
		alert('Warning: Transformation is too big: '+destWidth+'x'+destHeight+', Area: '+destArea);
		return -1;
	}*/
	//////////////////////////////////////////////////////////
	// calculate the perspective transformation matrix
	
	// the order of the points does not matter as long as it is the same in both calculateMatrix() calls
	var ps = adjoint33(calculateMatrix(p1, p2, p3, p4));
	var sq = calculateMatrix(q1, q2, q3, q4);

	var mTranslation = [[1, 0, offsetX], [0, 1, offsetY], [0, 0, 1]];
	transpose33(mTranslation);

	var mPerspective = matrix33();

	mult33(ps, sq, mPerspective);

	var fw_trafo = matrix33();
	mult33(mPerspective, mTranslation, fw_trafo);

	var bw_trafo = adjoint33(fw_trafo);
	
	//////////////////////////////////////////////////////////
	// convert the imagedata arrays of src and dest into a two-dimensional matrix
	
	// create two-dimensional array for storing the destination data
	var destPixelData = new Array(destWidth);
	for (var x=0; x<destWidth; x++) {
		destPixelData[x] = new Array(destHeight);
	}

	// create two-dimensional array for storing the source data
	var srcCtx = srcCanvas.getContext('2d');
	srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
	
	var srcPixelData = new Array(srcData.width);
	for (var x=0; x<srcData.width; x++) {
		srcPixelData[x] = new Array(srcData.height);
	}

	// filling the source array
	var i = 0;
	for (var y=0; y<srcData.height; y++) {
		for (var x=0; x<srcData.width; x++) {

			srcPixelData[x][y] = {
				r: srcData.data[i++],
				g: srcData.data[i++],
				b: srcData.data[i++],
				a: srcData.data[i++]
			};
		}
	}
	// append width and height for later use
	srcPixelData[srcPixelData.length] = srcData.width;
	srcPixelData[srcPixelData.length] = srcData.height;
	
	var destCanvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
	destCanvas.width = destWidth;
	destCanvas.height = destHeight;
	var destCtx = destCanvas.getContext('2d');
	
	
	destCtx.beginPath();
	destCtx.moveTo(q1.x+offsetX-1, q1.y+offsetY-1);
	destCtx.lineTo(q2.x+offsetX-1, q2.y+offsetY+1);
	destCtx.lineTo(q3.x+offsetX+1, q3.y+offsetY+1);
	destCtx.lineTo(q4.x+offsetX+1, q4.y+offsetY-1);
	destCtx.closePath();
	//destCtx.strokeStyle = 'green';
	//destCtx.stroke();

	// loop over to-be-warped image and apply the transformation
	for (var x=0; x<destWidth; x++) {
		for (var y=0; y<destHeight; y++) {
			// if dest pixel is not inside the to-be-warped area, skip the transformation and assign transparent black
			if (1) {
			//if (destCtx.isPointInPath(x, y)) {
			
				var srcCoord = applyTrafo(x, y, bw_trafo);
				
				if (interpolationMethod == 'nn') {
					destPixelData[x][y] = interpolateNN(srcCoord, srcPixelData)
				} else {
					destPixelData[x][y] = interpolateBL(srcCoord, srcPixelData)
				}
				
			} else {
				destPixelData[x][y] = {
					r: 0,
					g: 0,
					b: 0,
					a: 0
				};
			}
		}
	}

	
	var destData = destCtx.createImageData(destCanvas.width, destCanvas.height);

	// write the data back to the imagedata array
	var i = 0;
	for (var y=0; y<destHeight; y++) {
		for (var x=0; x<destWidth; x++) {

			destData.data[i++] = destPixelData[x][y].r;
			destData.data[i++] = destPixelData[x][y].g;
			destData.data[i++] = destPixelData[x][y].b;
			destData.data[i++] = destPixelData[x][y].a;
		}
	}

	destCtx.putImageData(destData, 0, 0);

	return destCanvas;
}

function interpolateNN(srcCoord, srcPixelData) {
	var w = srcPixelData[srcPixelData.length-2];
	var h = srcPixelData[srcPixelData.length-1];

	// set the dest pixel to transparent black if it is outside the source area
	if (srcCoord.x < 0 || srcCoord.x > w-1 || srcCoord.y < 0 || srcCoord.y > h-1) {
		return {
			r: 0,
			g: 0,
			b: 0,
			a: 0
		};
	}

	var x0 = Math.round(srcCoord.x);
	var y0 = Math.round(srcCoord.y);

	return srcPixelData[x0][y0];
}

function interpolateBL(srcCoord, srcPixelData) {
	var w = srcPixelData[srcPixelData.length-2];
	var h = srcPixelData[srcPixelData.length-1];
	
	var x0 = Math.floor(srcCoord.x);
	var x1 = x0+1;
	var y0 = Math.floor(srcCoord.y);
	var y1 = y0+1;

	// set the dest pixel to transparent black if it is outside the source area
	if (x0 < -1 || x1 > w || y0 < -1 || y1 > h) {
		return {
			r: 0,
			g: 0,
			b: 0,
			a: 0
		};
	}

	var f00 = (x1-srcCoord.x)*(y1-srcCoord.y);
	var f10 = (srcCoord.x-x0)*(y1-srcCoord.y);
	var f01 = (x1-srcCoord.x)*(srcCoord.y-y0);
	var f11 = (srcCoord.x-x0)*(srcCoord.y-y0);
	
	var alpha = [[-1, -1], [-1, -1]];
	
	if (x0 < 0) {
		x0 = 0;
		alpha[0][0] = 0;
		alpha[0][1] = 0;
	}
	
	if (y0 < 0) {
		y0 = 0;
		alpha[0][0] = 0;
		alpha[1][0] = 0;
	}
	
	if (x1 > w-1) {
		x1 = w-1;
		alpha[1][0] = 0;
		alpha[1][1] = 0;
	}
	
	if (y1 > h-1) {
		y1 = h-1;
		alpha[0][1] = 0;
		alpha[1][1] = 0;
	}
	
	
	//alert('srcx: '+srcCoord.x+'   srcy: '+srcCoord.y)
	//alert('x0: '+x0+'   y0: '+y0)
		
	// if alpha[x][x] has not been modified, then the pixel exists --> set alpha
	if (alpha[0][0] == -1) alpha[0][0] = srcPixelData[x0][y0].a;
	if (alpha[1][0] == -1) alpha[1][0] = srcPixelData[x1][y0].a;
	if (alpha[0][1] == -1) alpha[0][1] = srcPixelData[x0][y1].a;
	if (alpha[1][1] == -1) alpha[1][1] = srcPixelData[x1][y1].a;

	var pixel = {
		r: Math.round(srcPixelData[x0][y0].r*f00 + srcPixelData[x1][y0].r*f10 + srcPixelData[x0][y1].r*f01 + srcPixelData[x1][y1].r*f11),
		g: Math.round(srcPixelData[x0][y0].g*f00 + srcPixelData[x1][y0].g*f10 + srcPixelData[x0][y1].g*f01 + srcPixelData[x1][y1].g*f11),
		b: Math.round(srcPixelData[x0][y0].b*f00 + srcPixelData[x1][y0].b*f10 + srcPixelData[x0][y1].b*f01 + srcPixelData[x1][y1].b*f11),
		a: Math.round(alpha[0][0]*f00 + alpha[1][0]*f10 + alpha[0][1]*f01 + alpha[1][1]*f11)
	}

	if (pixel.r < 0) pixel.r = 0;
	if (pixel.g < 0) pixel.g = 0;
	if (pixel.b < 0) pixel.b = 0;
	if (pixel.a < 0) pixel.a = 0;

	if (pixel.r > 255) pixel.r = 255;
	if (pixel.g > 255) pixel.g = 255;
	if (pixel.b > 255) pixel.b = 255;
	if (pixel.a > 255) pixel.a = 255;

	return pixel;
}

function applyTrafo(x, y, trafo) {
	var w = trafo[0][2]*x + trafo[1][2]*y + trafo[2][2];
	if (w == 0) w = 1;

	return {x: (trafo[0][0]*x + trafo[1][0]*y + trafo[2][0])/w,
			y: (trafo[0][1]*x + trafo[1][1]*y + trafo[2][1])/w};
}

function mult33(m1, m2, result) {
	for (var i=0; i<3; i++) {
		for (var j=0; j<3; j++) {
			for (var k=0; k<3; k++) {
				result[i][j] += m1[i][k]*m2[k][j];
			}
		}
	}
}

function det22(m11, m12, m21, m22) {
	/*
	m11  m12
	m21  m22
	*/
	return m11*m22 - m12*m21;
}

function transpose33(matrix) {
	tmp = matrix[0][1];
	matrix[0][1] = matrix[1][0];
	matrix[1][0] = tmp;

	tmp = matrix[0][2];
	matrix[0][2] = matrix[2][0];
	matrix[2][0] = tmp;

	tmp = matrix[1][2];
	matrix[1][2] = matrix[2][1];
	matrix[2][1] = tmp;
}

function calculateMatrix(p0, p1, p2, p3) {
	/*
	a	d	g
	b	e	h
	c	f	i

	i = 1
	*/
	var a, b, c, d, e, f, g, h;


	var sx = p0.x - p1.x + p2.x - p3.x;
	var sy = p0.y - p1.y + p2.y - p3.y;

	if (sx == 0 && sy == 0) {
		a = p1.x - p0.x;
		b = p2.x - p1.x;
		c = p0.x;
		d = p1.y - p0.y;
		e = p2.y - p1.y;
		f = p0.y;
		g = 0;
		h = 0;
	} else {
		var dx1 = p1.x - p2.x;
		var dx2 = p3.x - p2.x;
		var dy1 = p1.y - p2.y;
		var dy2 = p3.y - p2.y;

		var det = det22(dx1, dx2, dy1, dy2);

		if (det == 0) {
			alert('det=0');
			return;
		}

		g = det22(sx, dx2, sy, dy2)/det;
		h = det22(dx1, sx, dy1, sy)/det;

		a = p1.x - p0.x + g*p1.x;
		b = p3.x - p0.x + h*p3.x;
		c = p0.x;
		d = p1.y - p0.y + g*p1.y;
		e = p3.y - p0.y + h*p3.y;
		f = p0.y;
	}

	var out = [[a, d, g], [b, e, h], [c, f, 1]];
	//transpose33(out)

	return out;
}

function matrix33() {
	return [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
}

function adjoint33(matrix) {
	/* using homogeneous coordinates, the adjoint can be used instead of the inverse of a matrix
	[[a, b, c], [d, e, f], [g, h, i]]
	m11 = e*i - h*f;
	m12 = c*h - b*i;
	m13 = b*f - c*e;

	m21 = f*g - d*i;
	m22 = a*i - c*g;
	m23 = c*d - a*f;

	m31 = d*h - e*g;
	m32 = b*g - a*h;
	m33 = a*e - b*d;
	*/

	m11 = matrix[1][1]*matrix[2][2] - matrix[2][1]*matrix[1][2];
	m12 = matrix[0][2]*matrix[2][1] - matrix[0][1]*matrix[2][2];
	m13 = matrix[0][1]*matrix[1][2] - matrix[0][2]*matrix[1][1];

	m21 = matrix[1][2]*matrix[2][0] - matrix[1][0]*matrix[2][2];
	m22 = matrix[0][0]*matrix[2][2] - matrix[0][2]*matrix[2][0];
	m23 = matrix[0][2]*matrix[1][0] - matrix[0][0]*matrix[1][2];

	m31 = matrix[1][0]*matrix[2][1] - matrix[1][1]*matrix[2][0];
	m32 = matrix[0][1]*matrix[2][0] - matrix[0][0]*matrix[2][1];
	m33 = matrix[0][0]*matrix[1][1] - matrix[0][1]*matrix[1][0];

	return [[m11, m12, m13], [m21, m22, m23], [m31, m32, m33]];
}
