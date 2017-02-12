// Copy by value, not reference
function deepClone(item) {
    if (!item) { return item; } // null, undefined values check

    var types = [ Number, String, Boolean ], 
        result;

    // normalizing primitives if someone did new String('aaa'), or new Number('444');
    types.forEach(function(type) {
        if (item instanceof type) {
            result = type( item );
        }
    });

    if (typeof result == "undefined") {
        if (Object.prototype.toString.call( item ) === "[object Array]") {
            result = [];
            item.forEach(function(child, index, array) { 
                result[index] = deepClone( child );
            });
        } else if (typeof item == "object") {
            // testing that this is DOM
            if (item.nodeType && typeof item.cloneNode == "function") {
                var result = item.cloneNode( true );    
            } else if (!item.prototype) { // check that this is a literal
                if (item instanceof Date) {
                    result = new Date(item);
                } else {
                    // it is an object literal
                    result = {};
                    for (var i in item) {
                        result[i] = deepClone( item[i] );
                    }
                }
            } else {
                // depending what you would like here,
                // just keep the reference, or create new object
                if (false && item.constructor) {
                    // would not advice to do that, reason? Read below
                    result = new item.constructor();
                } else {
                    result = item;
                }
            }
        } else {
            result = item;
        }
    }

    return result;
}

// Each shape (tab) is represented by a positive integer 1-4
// The inverse (blank) of that shape is represented by the same integer, but negative
//
// Each piece is rotated with an arbitrary edge facing up, and is identified
// by its index in the array, and which shapes it has [top, right, bottom, left]
//
// 1 - Cross
// 2 - Octagon
// 3 - Short Arrow
// 4 - Long Arrow
var pieces = [
	{ index: 0,  shapes: [1, 4, -1, -3] },
	{ index: 1,  shapes: [1, 4, -4, -2] },
	{ index: 2,  shapes: [4, 2, -2, -1] },
	{ index: 3,  shapes: [2, 1, -1, -2] },
	{ index: 4,  shapes: [2, 1, -4, -4] },
	{ index: 5,  shapes: [4, 2, -2, -4] },
	{ index: 6,  shapes: [2, 1, -3, -2] },
	{ index: 7,  shapes: [3, 3, -2, -1] },
	{ index: 8,  shapes: [2, 3, -1, -3] },
	{ index: 9,  shapes: [2, 3, -2, -1] },
	{ index: 10, shapes: [3, 1, -4, -3] },
	{ index: 11, shapes: [2, 2, -2, -4] },
	{ index: 12, shapes: [2, 3, -3, -4] },
	{ index: 13, shapes: [3, 4, -4, -2] },
	{ index: 14, shapes: [3, 3, -4, -1] },
	{ index: 15, shapes: [4, 4, -2, -3] }
];

// Returns the integer that represents the tab or blank
// that is the inverse of a shape
function invert(shape) {
	return -shape;
}

// A "type" of piece refers to a type of piece that will
// fit into other pieces based on the shapes along
// its edges.
//
// By pre-grouping the pieces, we avoid having to check
// every remaining piece at each spot in the puzzle
var types = {};

var list = document.getElementsByTagName('ol')[0];
var message = document.getElementById('message');

pieces.forEach(function(piece, i) {
	var shapes = piece.shapes;
	var copy;

	// A piece belongs to each of the four types identified by the
	// integers corresponding to shapes along its edges
	for (var j = 0; j < shapes.length; j++) {
		
		// Store a new copy of the piece for each of its four edges
		// with the edge always on the left and add it to the
		// type array for the shape along that edge
		copy = deepClone(piece);
		copy.top = shapes[(j+1)%4];
		copy.right = shapes[(j+2)%4];
		copy.bottom = shapes[(j+3)%4];
		copy.left = shapes[(j)];

		if (types[shapes[j]]) {
			types[shapes[j]].push(copy);
		} else {
			types[shapes[j]] = [copy];
		}
	}

	// Make another copy of the shape and add it to the type array
	// that is identified by the numbers corresponding to the shapes
	// along its top and left edges, e.g. "1, -1"
	copy = deepClone(piece);
	copy.top = shapes[1];
	copy.right = shapes[2];
	copy.bottom = shapes[3];
	copy.left = shapes[0];

	if (types[ shapes[0]+', '+shapes[1] ]) {
		types[ shapes[0]+', '+shapes[1] ].push(copy);
	} else {
		types[ shapes[0]+', '+shapes[1] ] = [copy];
	}

	// Rotate the shape so that a new set of edges are facing up and to the
	// left and identify the shape as belonging to this type as well
	copy = deepClone(piece);
	copy.top = shapes[2];
	copy.right = shapes[3];
	copy.bottom = shapes[0];
	copy.left = shapes[1];

	if (types[ shapes[1]+', '+shapes[2] ]) {
		types[ shapes[1]+', '+shapes[2] ].push(copy);
	} else {
		types[ shapes[1]+', '+shapes[2] ] = [copy];
	}

	// Rotate again
	copy = deepClone(piece);
	copy.top = shapes[3];
	copy.right = shapes[0];
	copy.bottom = shapes[1];
	copy.left = shapes[2];

	if (types[ shapes[2]+', '+shapes[3] ]) {
		types[ shapes[2]+', '+shapes[3] ].push(copy);
	} else {
		types[ shapes[2]+', '+shapes[3] ] = [copy];
	}

	// Rotate again
	copy = deepClone(piece);
	copy.top = shapes[0];
	copy.right = shapes[1];
	copy.bottom = shapes[2];
	copy.left = shapes[3];

	if (types[ shapes[3]+', '+shapes[0] ]) {
		types[ shapes[3]+', '+shapes[0] ].push(copy);
	} else {
		types[ shapes[3]+', '+shapes[0] ] = [copy];
	}
});

// Find all solutions to the puzzle given a starting
// index from the pieces array
//
// A "solution" to the puzzle will be an object
// with two keys. "indexes" will be an array of integers
// identifying which entry in the pieces array above should be placed
// in which spot, going from left to right, top to bottom
// The "orientations" key will be an array of objects in the same order, showing how to orient
// those pieces (which shape on the piece should be facing up, etc.)
function solvePuzzle(index, rotation) {
	index    = index    || 0;
	rotation = rotation || 0;

	// Initialize the solutions array with one of the pieces
	// in one of its 4 orientations
	var solutions = [{
		indexes: [index],
		orientations: [{
			top: pieces[index].shapes[(rotation+1)%4], 
			right: pieces[index].shapes[(rotation+2)%4], 
			bottom: pieces[index].shapes[(rotation+3)%4], 
			left: pieces[index].shapes[(rotation)]
		}]
	}];

	// With the first piece in place, start with the second piece
	// and move left to right, top to bottom
	for (var spot = 1; spot < 16; spot++) {

		// A temporary array with no solutions
		var tmp = [];

		// At any given spot, there may be multiple partial solutions
		// which are working so far. For example, If we need
		// a piece of type 2 in the second spot and there are 5
		// pieces of that type, than we have 5 partial solutions
		while(solutions.length > 0) {

			// Check each of those solutions one at a time to see
			// if we can find a piece that will fit into the next spot
			var solution = solutions.pop();

			// If we're in the first row, at each spot we need
			// a piece that is of the type that will fit with the prievious
			// piece's right edge
			if (spot < 4) {
				var typeNeeded = types[
					invert( solution.orientations[spot - 1].right )
				];
			} else {

				// If we're in one of the lower rows, but in the first column
				// we need a piece that will fit in with the bottom of the 
				// piece directly above it
				if (spot % 4 === 0) {
					var typeNeeded = types[
						invert ( solution.orientations[spot - 4].bottom )
					];
					
					// Rotate each piece in the type's array so it's facing
					// the correct way
					var tmp2 = [];
					var l = typeNeeded.length;

					for (var j = 0; j < l; j++) {
						var cloned = deepClone(typeNeeded[j]);
						cloned.top = typeNeeded[j].left;
						cloned.left = typeNeeded[j].bottom;
						cloned.bottom = typeNeeded[j].right;
						cloned.right = typeNeeded[j].top;
						tmp2.push(cloned);
					}

					typeNeeded = tmp2;

				// If we're in any other spot, we need a piece that will fit in
				// with BOTH the previous piece's right edge and the bottom edge
				// of the piece directly above it
				} else {
					var a = invert(solution.orientations[spot - 1].right);
					var b = invert(solution.orientations[spot - 4].bottom);

					var typeNeeded = types[a+', '+b];

					// Make sure pieces like this exist
					if (typeNeeded) {
						var tmp3 = [];
						var l = typeNeeded.length;

						for (var j = 0; j < l; j++) {
							var cloned = deepClone(typeNeeded[j]);

							if (cloned.left === a && cloned.top === b) {
								tmp3.push(cloned);
							}
						}

						typeNeeded = tmp3;
					}
				}
			}

			// Do we have any of the type of piece that will fit?
			if (typeNeeded) {

				for (var k = 0; k < typeNeeded.length; k++) {

					// Make sure we're not already using that piece as part of the 
					// current solution we're building up
					if ( solution.indexes.indexOf(typeNeeded[k].index) === -1 ) {
					 	
					 	// We have a piece that fits that we haven't used yet,
					 	// So add our new piece into the existing solution
					 	// being careful not to mutate state
					 	var newSolution = deepClone(solution);
					 	newSolution.indexes.push(typeNeeded[k].index);
					 	
					 	newSolution.orientations.push({
					 		top:    typeNeeded[k].top,
					 		right:  typeNeeded[k].right,
					 		bottom: typeNeeded[k].bottom,
					 		left:   typeNeeded[k].left,
					 	})

					 	tmp.push(newSolution);
					}
				}
			}
		}

		// If we've run out of possible solutions, tmp will still be an empty array
		solutions = tmp;
	}

	solutions.forEach(function(solution) {
		printSolution(solution);
	});

	if (rotation < 3) {
		rotation++
	} else {
		rotation = 0;
		index++;
	}

	if (index < 16) {
		setTimeout(function() {
			solvePuzzle(index, rotation);
		}, 0);
	} else {
		message.style.display = 'none';
		clearInterval(messageTimer);
		console.timeEnd('solving puzzle');
	}
}

function shapeToHTML(shape) {
	switch(shape) {
		case 1:
			return '<span class="cross">✚</span>';
		case -1:
			return '<span class="cross">(✚)</span>';
		case 2:
			return '<span class="octagon">&nbsp;&nbsp;&nbsp;<span class="octagon-shape"></span></span>';
		case -2:
			return '<span class="octagon">(&nbsp;&nbsp;&nbsp;<span class="octagon-shape"></span>)</span>';
		case 3:
			return '<span class="short-arrow">➧</span>';
		case -3:
			return '<span class="short-arrow">(➧)</span>';
		case 4:
			return '<span class="long-arrow">➔</span>';
		case -4:
			return '<span class="long-arrow">(➔)</span>';
	}
}

function printSolution(s) {
	var solution = s.orientations;
	var listItem = document.createElement('li');
	var html = '';

	for (var j = 0; j < 16; j++) {
		var piece = solution[j];

		html += '[ ';

		html += shapeToHTML(piece.top)+', ';
		html += shapeToHTML(piece.right)+', ';
		html += shapeToHTML(piece.bottom)+', ';
		html += shapeToHTML(piece.left);

		if (j === 15) html += ' ]';
		else html += ' ],<br>';
	}

	listItem.innerHTML = html;
	list.appendChild(listItem);
}

console.time('solving puzzle');
solvePuzzle();

var dotCount = 0;
var messageTimer = setInterval(function() {
	var html = 'Solving';

	for (var i = 0; i < 3; i++) {
		if (i < dotCount) html += '.';
		else html += '&nbsp;';
	}

	message.innerHTML = html;

	dotCount = (dotCount === 3) ? 0 : dotCount+1;
}, 200);