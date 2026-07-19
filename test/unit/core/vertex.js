import p5 from '../../../src/app.js';
import { vi } from 'vitest';

suite('Vertex', function() {
  var myp5;

  beforeEach(function() {
    new p5(function(p) {
      p.setup = function() {
        myp5 = p;
      };
    });
  });

  afterEach(function() {
    vi.restoreAllMocks();
    myp5.remove();
  });

  suite('p5.prototype.beginShape', function() {
    test('should be a function', function() {
      assert.ok(myp5.beginShape);
      assert.typeOf(myp5.beginShape, 'function');
    });
  });

  suite('p5.prototype.bezierVertex', function() {
    test('should be a function', function() {
      assert.ok(myp5.bezierVertex);
      assert.typeOf(myp5.bezierVertex, 'function');
    });
  });

  suite('p5.prototype.splineVertex', function() {
    test('should be a function', function() {
      assert.ok(myp5.splineVertex);
      assert.typeOf(myp5.splineVertex, 'function');
    });
  });

  suite('p5.prototype.arcVertex', function() {
    test('should be a function', function() {
      assert.ok(myp5.arcVertex);
      assert.typeOf(myp5.arcVertex, 'function');
    });

    test('creates one arc segment per call', function() {
      myp5.beginShape();
      myp5.vertex(10, 0);
      myp5.arcVertex(20, 20, 0, myp5.MINOR, myp5.CLOCKWISE, 0, 10);
      const shape = myp5._renderer.currentShape;
      const primitives = shape.contours[0].primitives;
      assert.equal(primitives.length, 2);
      const segment = primitives[1];
      assert.equal(segment.vertexCount, 1);
      assert.equal(segment.w, 20);
      assert.equal(segment.h, 20);
      assert.equal(segment.angle, 0);
      assert.equal(segment.type, myp5.MINOR);
      assert.equal(segment.direction, myp5.CLOCKWISE);
      assert.equal(segment.getEndVertex().position.x, 0);
      assert.equal(segment.getEndVertex().position.y, 10);
    });

    test('creates an anchor when called before any other vertex', function() {
      // same behavior as bezierVertex(): the first call adds an anchor
      myp5.beginShape();
      myp5.arcVertex(20, 20, 0, myp5.MINOR, myp5.CLOCKWISE, 10, 0);
      const shape = myp5._renderer.currentShape;
      const primitives = shape.contours[0].primitives;
      assert.equal(primitives.length, 1);
      assert.equal(primitives[0].getEndVertex().position.x, 10);
      assert.equal(primitives[0].getEndVertex().position.y, 0);
    });

    // Builds a shape with a single arc from (10, 0) to (0, 10) with both
    // radii equal to 10, and returns the arc's center parameterization
    function quarterArc(type, direction) {
      myp5.beginShape();
      myp5.vertex(10, 0);
      myp5.arcVertex(20, 20, 0, type, direction, 0, 10);
      const shape = myp5._renderer.currentShape;
      return shape.contours[0].primitives[1]._getCenterParameterization();
    }

    test('computes the center parameterization of a quarter circle', function() {
      const arc = quarterArc(myp5.MINOR, myp5.CLOCKWISE);
      assert.closeTo(arc.cx, 0, 1e-10);
      assert.closeTo(arc.cy, 0, 1e-10);
      assert.closeTo(arc.rx, 10, 1e-10);
      assert.closeTo(arc.ry, 10, 1e-10);
      assert.closeTo(arc.startAngle, 0, 1e-10);
      assert.closeTo(arc.deltaAngle, Math.PI / 2, 1e-10);
    });

    test('type and direction flags select the four distinct arcs', function() {
      const minorCW = quarterArc(myp5.MINOR, myp5.CLOCKWISE);
      assert.closeTo(minorCW.cx, 0, 1e-10);
      assert.closeTo(minorCW.cy, 0, 1e-10);
      assert.closeTo(minorCW.deltaAngle, Math.PI / 2, 1e-10);

      const minorCCW = quarterArc(myp5.MINOR, myp5.COUNTERCLOCKWISE);
      assert.closeTo(minorCCW.cx, 10, 1e-10);
      assert.closeTo(minorCCW.cy, 10, 1e-10);
      assert.closeTo(minorCCW.deltaAngle, -Math.PI / 2, 1e-10);

      const majorCW = quarterArc(myp5.MAJOR, myp5.CLOCKWISE);
      assert.closeTo(majorCW.cx, 10, 1e-10);
      assert.closeTo(majorCW.cy, 10, 1e-10);
      assert.closeTo(majorCW.deltaAngle, 3 * Math.PI / 2, 1e-10);

      const majorCCW = quarterArc(myp5.MAJOR, myp5.COUNTERCLOCKWISE);
      assert.closeTo(majorCCW.cx, 0, 1e-10);
      assert.closeTo(majorCCW.cy, 0, 1e-10);
      assert.closeTo(majorCCW.deltaAngle, -3 * Math.PI / 2, 1e-10);
    });

    test('scales radii up when the endpoints are too far apart', function() {
      myp5.beginShape();
      myp5.vertex(0, 0);
      myp5.arcVertex(10, 10, 0, myp5.MINOR, myp5.CLOCKWISE, 20, 0);
      const shape = myp5._renderer.currentShape;
      const arc = shape.contours[0].primitives[1]._getCenterParameterization();
      assert.closeTo(arc.rx, 10, 1e-10);
      assert.closeTo(arc.ry, 10, 1e-10);
      assert.closeTo(arc.cx, 10, 1e-10);
      assert.closeTo(arc.cy, 0, 1e-10);
      assert.closeTo(Math.abs(arc.deltaAngle), Math.PI, 1e-10);
    });

    test('treats coincident endpoints as a straight line', function() {
      myp5.beginShape();
      myp5.vertex(10, 0);
      myp5.arcVertex(20, 20, 0, myp5.MINOR, myp5.CLOCKWISE, 10, 0);
      const shape = myp5._renderer.currentShape;
      const arc = shape.contours[0].primitives[1]._getCenterParameterization();
      assert.isTrue(arc.degenerate);
    });

    test('treats a zero radius as a straight line', function() {
      myp5.beginShape();
      myp5.vertex(10, 0);
      myp5.arcVertex(0, 20, 0, myp5.MINOR, myp5.CLOCKWISE, 0, 10);
      const shape = myp5._renderer.currentShape;
      const arc = shape.contours[0].primitives[1]._getCenterParameterization();
      assert.isTrue(arc.degenerate);
    });
  });

  suite('p5.prototype.endShape', function() {
    test('should be a function', function() {
      assert.ok(myp5.endShape);
      assert.typeOf(myp5.endShape, 'function');
    });
  });

  suite('p5.prototype.vertex', function() {
    test('should be a function', function() {
      assert.ok(myp5.vertex);
      assert.typeOf(myp5.vertex, 'function');
    });
  });

  suite('path segment batching', function() {
    test('consecutive line vertices batch into one segment', function() {
      myp5.createCanvas(50, 50);
      myp5.beginShape();
      for (let i = 0; i < 5; i++) {
        myp5.vertex(i * 10, 5);
      }
      const primitives = myp5._renderer.currentShape.contours[0].primitives;
      // one anchor plus one polyline segment holding the remaining vertices
      assert.equal(primitives.length, 2);
      assert.equal(primitives[1].vertexCount, 4);
      myp5.endShape();
    });

    test('endShape(CLOSE) keeps the closing vertex in its own segment', function() {
      myp5.createCanvas(50, 50);
      myp5.beginShape();
      myp5.vertex(0, 0);
      myp5.vertex(10, 0);
      myp5.vertex(10, 10);
      myp5.endShape(myp5.CLOSE);
      const primitives = myp5._renderer.currentShape.contours[0].primitives;
      // anchor + batched polyline + separate closing segment
      assert.equal(primitives.length, 3);
      assert.equal(primitives[1].vertexCount, 2);
      assert.isFalse(primitives[1].isClosing);
      assert.equal(primitives[2].vertexCount, 1);
      assert.isTrue(primitives[2].isClosing);
    });

    test('line vertices after a spline segment start a new segment', function() {
      myp5.createCanvas(50, 50);
      myp5.beginShape();
      myp5.vertex(0, 0);
      myp5.splineVertex(10, 0);
      myp5.vertex(20, 0);
      myp5.vertex(30, 0);
      const primitives = myp5._renderer.currentShape.contours[0].primitives;
      // anchor + spline segment + one batched polyline segment
      assert.equal(primitives.length, 3);
      assert.equal(primitives[2].vertexCount, 2);
      myp5.endShape();
    });

    test('beginContour() batches independently per contour', function() {
      myp5.createCanvas(50, 50);
      myp5.beginShape();
      myp5.vertex(0, 0);
      myp5.vertex(40, 0);
      myp5.vertex(40, 40);
      myp5.beginContour();
      myp5.vertex(10, 10);
      myp5.vertex(20, 10);
      myp5.vertex(20, 20);
      myp5.endContour();
      const contours = myp5._renderer.currentShape.contours;
      assert.equal(contours.length, 2);
      assert.equal(contours[0].primitives.length, 2);
      assert.equal(contours[0].primitives[1].vertexCount, 2);
      assert.equal(contours[1].primitives.length, 2);
      assert.equal(contours[1].primitives[1].vertexCount, 2);
      myp5.endShape();
    });

    test('non-PATH shapes keep using primitive capacity', function() {
      myp5.createCanvas(50, 50);
      myp5.beginShape(myp5.TRIANGLES);
      for (let i = 0; i < 6; i++) {
        myp5.vertex(i * 5, i * 5);
      }
      const primitives = myp5._renderer.currentShape.contours[0].primitives;
      assert.equal(primitives.length, 2);
      assert.equal(primitives[0].vertexCount, 3);
      assert.equal(primitives[1].vertexCount, 3);
      myp5.endShape();
    });
  });
});
