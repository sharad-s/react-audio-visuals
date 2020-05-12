function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

var THREE = require('three');

THREE.RenderableObject = function () {
  this.id = 0;
  this.object = null;
  this.z = 0;
  this.renderOrder = 0;
};

THREE.RenderableFace = function () {
  this.id = 0;
  this.v1 = new THREE.RenderableVertex();
  this.v2 = new THREE.RenderableVertex();
  this.v3 = new THREE.RenderableVertex();
  this.normalModel = new THREE.Vector3();
  this.vertexNormalsModel = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  this.vertexNormalsLength = 0;
  this.color = new THREE.Color();
  this.material = null;
  this.uvs = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()];
  this.z = 0;
  this.renderOrder = 0;
};

THREE.RenderableVertex = function () {
  this.position = new THREE.Vector3();
  this.positionWorld = new THREE.Vector3();
  this.positionScreen = new THREE.Vector4();
  this.visible = !0;
};

THREE.RenderableVertex.prototype.copy = function (vertex) {
  this.positionWorld.copy(vertex.positionWorld);
  this.positionScreen.copy(vertex.positionScreen);
};

THREE.RenderableLine = function () {
  this.id = 0;
  this.v1 = new THREE.RenderableVertex();
  this.v2 = new THREE.RenderableVertex();
  this.vertexColors = [new THREE.Color(), new THREE.Color()];
  this.material = null;
  this.z = 0;
  this.renderOrder = 0;
};

THREE.RenderableSprite = function () {
  this.id = 0;
  this.object = null;
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.rotation = 0;
  this.scale = new THREE.Vector2();
  this.material = null;
  this.renderOrder = 0;
};

THREE.Projector = function () {
  var _object,
      _objectCount,
      _objectPool = [],
      _objectPoolLength = 0,
      _vertex,
      _vertexCount,
      _vertexPool = [],
      _vertexPoolLength = 0,
      _face,
      _faceCount,
      _facePool = [],
      _facePoolLength = 0,
      _line,
      _lineCount,
      _linePool = [],
      _linePoolLength = 0,
      _sprite,
      _spriteCount,
      _spritePool = [],
      _spritePoolLength = 0,
      _renderData = {
    objects: [],
    lights: [],
    elements: []
  },
      _vector3 = new THREE.Vector3(),
      _vector4 = new THREE.Vector4(),
      _clipBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)),
      _boundingBox = new THREE.Box3(),
      _points3 = new Array(3),
      _points4 = new Array(4),
      _viewMatrix = new THREE.Matrix4(),
      _viewProjectionMatrix = new THREE.Matrix4(),
      _modelMatrix,
      _modelViewProjectionMatrix = new THREE.Matrix4(),
      _normalMatrix = new THREE.Matrix3(),
      _frustum = new THREE.Frustum(),
      _clippedVertex1PositionScreen = new THREE.Vector4(),
      _clippedVertex2PositionScreen = new THREE.Vector4();

  this.projectVector = function (vector, camera) {
    console.warn('THREE.Projector: .projectVector() is now vector.project().');
    vector.project(camera);
  };

  this.unprojectVector = function (vector, camera) {
    console.warn('THREE.Projector: .unprojectVector() is now vector.unproject().');
    vector.unproject(camera);
  };

  this.pickingRay = function (vector, camera) {
    console.error('THREE.Projector: .pickingRay() is now raycaster.setFromCamera().');
  };

  var RenderList = function RenderList() {
    var normals = [];
    var uvs = [];
    var object = null;
    var material = null;
    var normalMatrix = new THREE.Matrix3();

    function setObject(value) {
      object = value;
      material = object.material;
      normalMatrix.getNormalMatrix(object.matrixWorld);
      normals.length = 0;
      uvs.length = 0;
    }

    function projectVertex(vertex) {
      var position = vertex.position;
      var positionWorld = vertex.positionWorld;
      var positionScreen = vertex.positionScreen;
      positionWorld.copy(position).applyMatrix4(_modelMatrix);
      positionScreen.copy(positionWorld).applyMatrix4(_viewProjectionMatrix);
      var invW = 1 / positionScreen.w;
      positionScreen.x *= invW;
      positionScreen.y *= invW;
      positionScreen.z *= invW;
      vertex.visible = positionScreen.x >= -1 && positionScreen.x <= 1 && positionScreen.y >= -1 && positionScreen.y <= 1 && positionScreen.z >= -1 && positionScreen.z <= 1;
    }

    function pushVertex(x, y, z) {
      _vertex = getNextVertexInPool();

      _vertex.position.set(x, y, z);

      projectVertex(_vertex);
    }

    function pushNormal(x, y, z) {
      normals.push(x, y, z);
    }

    function pushUv(x, y) {
      uvs.push(x, y);
    }

    function checkTriangleVisibility(v1, v2, v3) {
      if (v1.visible === !0 || v2.visible === !0 || v3.visible === !0) return !0;
      _points3[0] = v1.positionScreen;
      _points3[1] = v2.positionScreen;
      _points3[2] = v3.positionScreen;
      return _clipBox.intersectsBox(_boundingBox.setFromPoints(_points3));
    }

    function checkBackfaceCulling(v1, v2, v3) {
      return (v3.positionScreen.x - v1.positionScreen.x) * (v2.positionScreen.y - v1.positionScreen.y) - (v3.positionScreen.y - v1.positionScreen.y) * (v2.positionScreen.x - v1.positionScreen.x) < 0;
    }

    function pushLine(a, b) {
      var v1 = _vertexPool[a];
      var v2 = _vertexPool[b];
      _line = getNextLineInPool();
      _line.id = object.id;

      _line.v1.copy(v1);

      _line.v2.copy(v2);

      _line.z = (v1.positionScreen.z + v2.positionScreen.z) / 2;
      _line.renderOrder = object.renderOrder;
      _line.material = object.material;

      _renderData.elements.push(_line);
    }

    function pushTriangle(a, b, c) {
      var v1 = _vertexPool[a];
      var v2 = _vertexPool[b];
      var v3 = _vertexPool[c];
      if (checkTriangleVisibility(v1, v2, v3) === !1) return;

      if (material.side === THREE.DoubleSide || checkBackfaceCulling(v1, v2, v3) === !0) {
        _face = getNextFaceInPool();
        _face.id = object.id;

        _face.v1.copy(v1);

        _face.v2.copy(v2);

        _face.v3.copy(v3);

        _face.z = (v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z) / 3;
        _face.renderOrder = object.renderOrder;

        _face.normalModel.fromArray(normals, a * 3);

        _face.normalModel.applyMatrix3(normalMatrix).normalize();

        for (var i = 0; i < 3; i++) {
          var normal = _face.vertexNormalsModel[i];
          normal.fromArray(normals, arguments[i] * 3);
          normal.applyMatrix3(normalMatrix).normalize();
          var uv = _face.uvs[i];
          uv.fromArray(uvs, arguments[i] * 2);
        }

        _face.vertexNormalsLength = 3;
        _face.material = object.material;

        _renderData.elements.push(_face);
      }
    }

    return {
      setObject: setObject,
      projectVertex: projectVertex,
      checkTriangleVisibility: checkTriangleVisibility,
      checkBackfaceCulling: checkBackfaceCulling,
      pushVertex: pushVertex,
      pushNormal: pushNormal,
      pushUv: pushUv,
      pushLine: pushLine,
      pushTriangle: pushTriangle
    };
  };

  var renderList = new RenderList();

  this.projectScene = function (scene, camera, sortObjects, sortElements) {
    _faceCount = 0;
    _lineCount = 0;
    _spriteCount = 0;
    _renderData.elements.length = 0;
    if (scene.autoUpdate === !0) scene.updateMatrixWorld();
    if (camera.parent === null) camera.updateMatrixWorld();

    _viewMatrix.copy(camera.matrixWorldInverse.getInverse(camera.matrixWorld));

    _viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);

    _frustum.setFromMatrix(_viewProjectionMatrix);

    _objectCount = 0;
    _renderData.objects.length = 0;
    _renderData.lights.length = 0;

    function addObject(object) {
      _object = getNextObjectInPool();
      _object.id = object.id;
      _object.object = object;

      _vector3.setFromMatrixPosition(object.matrixWorld);

      _vector3.applyProjection(_viewProjectionMatrix);

      _object.z = _vector3.z;
      _object.renderOrder = object.renderOrder;

      _renderData.objects.push(_object);
    }

    scene.traverseVisible(function (object) {
      if (object instanceof THREE.Light) {
        _renderData.lights.push(object);
      } else if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        if (object.material.visible === !1) return;
        if (object.frustumCulled === !0 && _frustum.intersectsObject(object) === !1) return;
        addObject(object);
      } else if (object instanceof THREE.Sprite) {
        if (object.material.visible === !1) return;
        if (object.frustumCulled === !0 && _frustum.intersectsSprite(object) === !1) return;
        addObject(object);
      }
    });

    if (sortObjects === !0) {
      _renderData.objects.sort(painterSort);
    }

    for (var o = 0, ol = _renderData.objects.length; o < ol; o++) {
      var object = _renderData.objects[o].object;
      var geometry = object.geometry;
      renderList.setObject(object);
      _modelMatrix = object.matrixWorld;
      _vertexCount = 0;

      if (object instanceof THREE.Mesh) {
        if (geometry instanceof THREE.BufferGeometry) {
          var attributes = geometry.attributes;
          var groups = geometry.groups;
          if (attributes.position === undefined) continue;
          var positions = attributes.position.array;

          for (var i = 0, l = positions.length; i < l; i += 3) {
            renderList.pushVertex(positions[i], positions[i + 1], positions[i + 2]);
          }

          if (attributes.normal !== undefined) {
            var normals = attributes.normal.array;

            for (var i = 0, l = normals.length; i < l; i += 3) {
              renderList.pushNormal(normals[i], normals[i + 1], normals[i + 2]);
            }
          }

          if (attributes.uv !== undefined) {
            var uvs = attributes.uv.array;

            for (var i = 0, l = uvs.length; i < l; i += 2) {
              renderList.pushUv(uvs[i], uvs[i + 1]);
            }
          }

          if (geometry.index !== null) {
            var indices = geometry.index.array;

            if (groups.length > 0) {
              for (var o = 0; o < groups.length; o++) {
                var group = groups[o];

                for (var i = group.start, l = group.start + group.count; i < l; i += 3) {
                  renderList.pushTriangle(indices[i], indices[i + 1], indices[i + 2]);
                }
              }
            } else {
              for (var i = 0, l = indices.length; i < l; i += 3) {
                renderList.pushTriangle(indices[i], indices[i + 1], indices[i + 2]);
              }
            }
          } else {
            for (var i = 0, l = positions.length / 3; i < l; i += 3) {
              renderList.pushTriangle(i, i + 1, i + 2);
            }
          }
        } else if (geometry instanceof THREE.Geometry) {
          var vertices = geometry.vertices;
          var faces = geometry.faces;
          var faceVertexUvs = geometry.faceVertexUvs[0];

          _normalMatrix.getNormalMatrix(_modelMatrix);

          var material = object.material;
          var isFaceMaterial = material instanceof THREE.MultiMaterial;
          var objectMaterials = isFaceMaterial === !0 ? object.material : null;

          for (var v = 0, vl = vertices.length; v < vl; v++) {
            var vertex = vertices[v];

            _vector3.copy(vertex);

            if (material.morphTargets === !0) {
              var morphTargets = geometry.morphTargets;
              var morphInfluences = object.morphTargetInfluences;

              for (var t = 0, tl = morphTargets.length; t < tl; t++) {
                var influence = morphInfluences[t];
                if (influence === 0) continue;
                var target = morphTargets[t];
                var targetVertex = target.vertices[v];
                _vector3.x += (targetVertex.x - vertex.x) * influence;
                _vector3.y += (targetVertex.y - vertex.y) * influence;
                _vector3.z += (targetVertex.z - vertex.z) * influence;
              }
            }

            renderList.pushVertex(_vector3.x, _vector3.y, _vector3.z);
          }

          for (var f = 0, fl = faces.length; f < fl; f++) {
            var face = faces[f];
            material = isFaceMaterial === !0 ? objectMaterials.materials[face.materialIndex] : object.material;
            if (material === undefined) continue;
            var side = material.side;
            var v1 = _vertexPool[face.a];
            var v2 = _vertexPool[face.b];
            var v3 = _vertexPool[face.c];
            if (renderList.checkTriangleVisibility(v1, v2, v3) === !1) continue;
            var visible = renderList.checkBackfaceCulling(v1, v2, v3);

            if (side !== THREE.DoubleSide) {
              if (side === THREE.FrontSide && visible === !1) continue;
              if (side === THREE.BackSide && visible === !0) continue;
            }

            _face = getNextFaceInPool();
            _face.id = object.id;

            _face.v1.copy(v1);

            _face.v2.copy(v2);

            _face.v3.copy(v3);

            _face.normalModel.copy(face.normal);

            if (visible === !1 && (side === THREE.BackSide || side === THREE.DoubleSide)) {
              _face.normalModel.negate();
            }

            _face.normalModel.applyMatrix3(_normalMatrix).normalize();

            var faceVertexNormals = face.vertexNormals;

            for (var n = 0, nl = Math.min(faceVertexNormals.length, 3); n < nl; n++) {
              var normalModel = _face.vertexNormalsModel[n];
              normalModel.copy(faceVertexNormals[n]);

              if (visible === !1 && (side === THREE.BackSide || side === THREE.DoubleSide)) {
                normalModel.negate();
              }

              normalModel.applyMatrix3(_normalMatrix).normalize();
            }

            _face.vertexNormalsLength = faceVertexNormals.length;
            var vertexUvs = faceVertexUvs[f];

            if (vertexUvs !== undefined) {
              for (var u = 0; u < 3; u++) {
                _face.uvs[u].copy(vertexUvs[u]);
              }
            }

            _face.color = face.color;
            _face.material = material;
            _face.z = (v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z) / 3;
            _face.renderOrder = object.renderOrder;

            _renderData.elements.push(_face);
          }
        }
      } else if (object instanceof THREE.Line) {
        if (geometry instanceof THREE.BufferGeometry) {
          var attributes = geometry.attributes;

          if (attributes.position !== undefined) {
            var positions = attributes.position.array;

            for (var i = 0, l = positions.length; i < l; i += 3) {
              renderList.pushVertex(positions[i], positions[i + 1], positions[i + 2]);
            }

            if (geometry.index !== null) {
              var indices = geometry.index.array;

              for (var i = 0, l = indices.length; i < l; i += 2) {
                renderList.pushLine(indices[i], indices[i + 1]);
              }
            } else {
              var step = object instanceof THREE.LineSegments ? 2 : 1;

              for (var i = 0, l = positions.length / 3 - 1; i < l; i += step) {
                renderList.pushLine(i, i + 1);
              }
            }
          }
        } else if (geometry instanceof THREE.Geometry) {
          _modelViewProjectionMatrix.multiplyMatrices(_viewProjectionMatrix, _modelMatrix);

          var vertices = object.geometry.vertices;
          if (vertices.length === 0) continue;
          v1 = getNextVertexInPool();
          v1.positionScreen.copy(vertices[0]).applyMatrix4(_modelViewProjectionMatrix);
          var step = object instanceof THREE.LineSegments ? 2 : 1;

          for (var v = 1, vl = vertices.length; v < vl; v++) {
            v1 = getNextVertexInPool();
            v1.positionScreen.copy(vertices[v]).applyMatrix4(_modelViewProjectionMatrix);
            if ((v + 1) % step > 0) continue;
            v2 = _vertexPool[_vertexCount - 2];

            _clippedVertex1PositionScreen.copy(v1.positionScreen);

            _clippedVertex2PositionScreen.copy(v2.positionScreen);

            if (clipLine(_clippedVertex1PositionScreen, _clippedVertex2PositionScreen) === !0) {
              _clippedVertex1PositionScreen.multiplyScalar(1 / _clippedVertex1PositionScreen.w);

              _clippedVertex2PositionScreen.multiplyScalar(1 / _clippedVertex2PositionScreen.w);

              _line = getNextLineInPool();
              _line.id = object.id;

              _line.v1.positionScreen.copy(_clippedVertex1PositionScreen);

              _line.v2.positionScreen.copy(_clippedVertex2PositionScreen);

              _line.z = Math.max(_clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z);
              _line.renderOrder = object.renderOrder;
              _line.material = object.material;

              if (object.material.vertexColors === THREE.VertexColors) {
                _line.vertexColors[0].copy(object.geometry.colors[v]);

                _line.vertexColors[1].copy(object.geometry.colors[v - 1]);
              }

              _renderData.elements.push(_line);
            }
          }
        }
      } else if (object instanceof THREE.Sprite) {
        _vector4.set(_modelMatrix.elements[12], _modelMatrix.elements[13], _modelMatrix.elements[14], 1);

        _vector4.applyMatrix4(_viewProjectionMatrix);

        var invW = 1 / _vector4.w;
        _vector4.z *= invW;

        if (_vector4.z >= -1 && _vector4.z <= 1) {
          _sprite = getNextSpriteInPool();
          _sprite.id = object.id;
          _sprite.x = _vector4.x * invW;
          _sprite.y = _vector4.y * invW;
          _sprite.z = _vector4.z;
          _sprite.renderOrder = object.renderOrder;
          _sprite.object = object;
          _sprite.rotation = object.rotation;
          _sprite.scale.x = object.scale.x * Math.abs(_sprite.x - (_vector4.x + camera.projectionMatrix.elements[0]) / (_vector4.w + camera.projectionMatrix.elements[12]));
          _sprite.scale.y = object.scale.y * Math.abs(_sprite.y - (_vector4.y + camera.projectionMatrix.elements[5]) / (_vector4.w + camera.projectionMatrix.elements[13]));
          _sprite.material = object.material;

          _renderData.elements.push(_sprite);
        }
      }
    }

    if (sortElements === !0) {
      _renderData.elements.sort(painterSort);
    }

    return _renderData;
  };

  function getNextObjectInPool() {
    if (_objectCount === _objectPoolLength) {
      var object = new THREE.RenderableObject();

      _objectPool.push(object);

      _objectPoolLength++;
      _objectCount++;
      return object;
    }

    return _objectPool[_objectCount++];
  }

  function getNextVertexInPool() {
    if (_vertexCount === _vertexPoolLength) {
      var vertex = new THREE.RenderableVertex();

      _vertexPool.push(vertex);

      _vertexPoolLength++;
      _vertexCount++;
      return vertex;
    }

    return _vertexPool[_vertexCount++];
  }

  function getNextFaceInPool() {
    if (_faceCount === _facePoolLength) {
      var face = new THREE.RenderableFace();

      _facePool.push(face);

      _facePoolLength++;
      _faceCount++;
      return face;
    }

    return _facePool[_faceCount++];
  }

  function getNextLineInPool() {
    if (_lineCount === _linePoolLength) {
      var line = new THREE.RenderableLine();

      _linePool.push(line);

      _linePoolLength++;
      _lineCount++;
      return line;
    }

    return _linePool[_lineCount++];
  }

  function getNextSpriteInPool() {
    if (_spriteCount === _spritePoolLength) {
      var sprite = new THREE.RenderableSprite();

      _spritePool.push(sprite);

      _spritePoolLength++;
      _spriteCount++;
      return sprite;
    }

    return _spritePool[_spriteCount++];
  }

  function painterSort(a, b) {
    if (a.renderOrder !== b.renderOrder) {
      return a.renderOrder - b.renderOrder;
    } else if (a.z !== b.z) {
      return b.z - a.z;
    } else if (a.id !== b.id) {
      return a.id - b.id;
    } else {
      return 0;
    }
  }

  function clipLine(s1, s2) {
    var alpha1 = 0,
        alpha2 = 1,
        bc1near = s1.z + s1.w,
        bc2near = s2.z + s2.w,
        bc1far = -s1.z + s1.w,
        bc2far = -s2.z + s2.w;

    if (bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0) {
      return !0;
    } else if (bc1near < 0 && bc2near < 0 || bc1far < 0 && bc2far < 0) {
      return !1;
    } else {
      if (bc1near < 0) {
        alpha1 = Math.max(alpha1, bc1near / (bc1near - bc2near));
      } else if (bc2near < 0) {
        alpha2 = Math.min(alpha2, bc1near / (bc1near - bc2near));
      }

      if (bc1far < 0) {
        alpha1 = Math.max(alpha1, bc1far / (bc1far - bc2far));
      } else if (bc2far < 0) {
        alpha2 = Math.min(alpha2, bc1far / (bc1far - bc2far));
      }

      if (alpha2 < alpha1) {
        return !1;
      } else {
        s1.lerp(s2, alpha1);
        s2.lerp(s1, 1 - alpha2);
        return !0;
      }
    }
  }
};

THREE.SpriteCanvasMaterial = function (parameters) {
  THREE.Material.call(this);
  this.type = 'SpriteCanvasMaterial';
  this.color = new THREE.Color(0xffffff);

  this.program = function (context, color) {};

  this.setValues(parameters);
};

THREE.SpriteCanvasMaterial.prototype = Object.create(THREE.Material.prototype);
THREE.SpriteCanvasMaterial.prototype.constructor = THREE.SpriteCanvasMaterial;

THREE.SpriteCanvasMaterial.prototype.clone = function () {
  var material = new THREE.SpriteCanvasMaterial();
  material.copy(this);
  material.color.copy(this.color);
  material.program = this.program;
  return material;
};

THREE.CanvasRenderer = function (parameters) {
  parameters = parameters || {};

  var _this = this,
      _renderData,
      _elements,
      _lights,
      _projector = new THREE.Projector(),
      _canvas = parameters.canvas !== undefined ? parameters.canvas : document.createElement('canvas'),
      _canvasWidth = _canvas.width,
      _canvasHeight = _canvas.height,
      _canvasWidthHalf = Math.floor(_canvasWidth / 2),
      _canvasHeightHalf = Math.floor(_canvasHeight / 2),
      _viewportX = 0,
      _viewportY = 0,
      _viewportWidth = _canvasWidth,
      _viewportHeight = _canvasHeight,
      _pixelRatio = 1,
      _context = _canvas.getContext('2d', {
    alpha: parameters.alpha === !0
  }),
      _clearColor = new THREE.Color(0x000000),
      _clearAlpha = parameters.alpha === !0 ? 0 : 1,
      _contextGlobalAlpha = 1,
      _contextGlobalCompositeOperation = 0,
      _contextStrokeStyle = null,
      _contextFillStyle = null,
      _contextLineWidth = null,
      _contextLineCap = null,
      _contextLineJoin = null,
      _contextLineDash = [],
      _v1,
      _v2,
      _v3,
      _v5 = new THREE.RenderableVertex(),
      _v6 = new THREE.RenderableVertex(),
      _v1x,
      _v1y,
      _v2x,
      _v2y,
      _v3x,
      _v3y,
      _color = new THREE.Color(),
      _color1 = new THREE.Color(),
      _color2 = new THREE.Color(),
      _color3 = new THREE.Color(),
      _color4 = new THREE.Color(),
      _diffuseColor = new THREE.Color(),
      _emissiveColor = new THREE.Color(),
      _lightColor = new THREE.Color(),
      _patterns = {},
      _uvs,
      _uv1x,
      _uv1y,
      _uv2x,
      _uv2y,
      _uv3x,
      _uv3y,
      _clipBox = new THREE.Box2(),
      _clearBox = new THREE.Box2(),
      _elemBox = new THREE.Box2(),
      _ambientLight = new THREE.Color(),
      _directionalLights = new THREE.Color(),
      _pointLights = new THREE.Color(),
      _vector3 = new THREE.Vector3(),
      _centroid = new THREE.Vector3(),
      _normal = new THREE.Vector3(),
      _normalViewMatrix = new THREE.Matrix3();

  if (_context.setLineDash === undefined) {
    _context.setLineDash = function () {};
  }

  this.domElement = _canvas;
  this.autoClear = !0;
  this.sortObjects = !0;
  this.sortElements = !0;
  this.info = {
    render: {
      vertices: 0,
      faces: 0
    }
  };

  this.supportsVertexTextures = function () {};

  this.setFaceCulling = function () {};

  this.getContext = function () {
    return _context;
  };

  this.getContextAttributes = function () {
    return _context.getContextAttributes();
  };

  this.getPixelRatio = function () {
    return _pixelRatio;
  };

  this.setPixelRatio = function (value) {
    if (value !== undefined) _pixelRatio = value;
  };

  this.setSize = function (width, height, updateStyle) {
    _canvasWidth = width * _pixelRatio;
    _canvasHeight = height * _pixelRatio;
    _canvas.width = _canvasWidth;
    _canvas.height = _canvasHeight;
    _canvasWidthHalf = Math.floor(_canvasWidth / 2);
    _canvasHeightHalf = Math.floor(_canvasHeight / 2);

    if (updateStyle !== !1) {
      _canvas.style.width = width + 'px';
      _canvas.style.height = height + 'px';
    }

    _clipBox.min.set(-_canvasWidthHalf, -_canvasHeightHalf);

    _clipBox.max.set(_canvasWidthHalf, _canvasHeightHalf);

    _clearBox.min.set(-_canvasWidthHalf, -_canvasHeightHalf);

    _clearBox.max.set(_canvasWidthHalf, _canvasHeightHalf);

    _contextGlobalAlpha = 1;
    _contextGlobalCompositeOperation = 0;
    _contextStrokeStyle = null;
    _contextFillStyle = null;
    _contextLineWidth = null;
    _contextLineCap = null;
    _contextLineJoin = null;
    this.setViewport(0, 0, width, height);
  };

  this.setViewport = function (x, y, width, height) {
    _viewportX = x * _pixelRatio;
    _viewportY = y * _pixelRatio;
    _viewportWidth = width * _pixelRatio;
    _viewportHeight = height * _pixelRatio;
  };

  this.setScissor = function () {};

  this.setScissorTest = function () {};

  this.setClearColor = function (color, alpha) {
    _clearColor.set(color);

    _clearAlpha = alpha !== undefined ? alpha : 1;

    _clearBox.min.set(-_canvasWidthHalf, -_canvasHeightHalf);

    _clearBox.max.set(_canvasWidthHalf, _canvasHeightHalf);
  };

  this.setClearColorHex = function (hex, alpha) {
    console.warn('THREE.CanvasRenderer: .setClearColorHex() is being removed. Use .setClearColor() instead.');
    this.setClearColor(hex, alpha);
  };

  this.getClearColor = function () {
    return _clearColor;
  };

  this.getClearAlpha = function () {
    return _clearAlpha;
  };

  this.getMaxAnisotropy = function () {
    return 0;
  };

  this.clear = function () {
    if (_clearBox.isEmpty() === !1) {
      _clearBox.intersect(_clipBox);

      _clearBox.expandByScalar(2);

      _clearBox.min.x = _clearBox.min.x + _canvasWidthHalf;
      _clearBox.min.y = -_clearBox.min.y + _canvasHeightHalf;
      _clearBox.max.x = _clearBox.max.x + _canvasWidthHalf;
      _clearBox.max.y = -_clearBox.max.y + _canvasHeightHalf;

      if (_clearAlpha < 1) {
        _context.clearRect(_clearBox.min.x | 0, _clearBox.max.y | 0, _clearBox.max.x - _clearBox.min.x | 0, _clearBox.min.y - _clearBox.max.y | 0);
      }

      if (_clearAlpha > 0) {
        setBlending(THREE.NormalBlending);
        setOpacity(1);
        setFillStyle('rgba(' + Math.floor(_clearColor.r * 255) + ',' + Math.floor(_clearColor.g * 255) + ',' + Math.floor(_clearColor.b * 255) + ',' + _clearAlpha + ')');

        _context.fillRect(_clearBox.min.x | 0, _clearBox.max.y | 0, _clearBox.max.x - _clearBox.min.x | 0, _clearBox.min.y - _clearBox.max.y | 0);
      }

      _clearBox.makeEmpty();
    }
  };

  this.clearColor = function () {};

  this.clearDepth = function () {};

  this.clearStencil = function () {};

  this.render = function (scene, camera) {
    if (camera instanceof THREE.Camera === !1) {
      console.error('THREE.CanvasRenderer.render: camera is not an instance of THREE.Camera.');
      return;
    }

    if (this.autoClear === !0) this.clear();
    _this.info.render.vertices = 0;
    _this.info.render.faces = 0;

    _context.setTransform(_viewportWidth / _canvasWidth, 0, 0, -_viewportHeight / _canvasHeight, _viewportX, _canvasHeight - _viewportY);

    _context.translate(_canvasWidthHalf, _canvasHeightHalf);

    _renderData = _projector.projectScene(scene, camera, this.sortObjects, this.sortElements);
    _elements = _renderData.elements;
    _lights = _renderData.lights;

    _normalViewMatrix.getNormalMatrix(camera.matrixWorldInverse);

    calculateLights();

    for (var e = 0, el = _elements.length; e < el; e++) {
      var element = _elements[e];
      var material = element.material;
      if (material === undefined || material.opacity === 0) continue;

      _elemBox.makeEmpty();

      if (element instanceof THREE.RenderableSprite) {
        _v1 = element;
        _v1.x *= _canvasWidthHalf;
        _v1.y *= _canvasHeightHalf;
        renderSprite(_v1, element, material);
      } else if (element instanceof THREE.RenderableLine) {
        _v1 = element.v1;
        _v2 = element.v2;
        _v1.positionScreen.x *= _canvasWidthHalf;
        _v1.positionScreen.y *= _canvasHeightHalf;
        _v2.positionScreen.x *= _canvasWidthHalf;
        _v2.positionScreen.y *= _canvasHeightHalf;

        _elemBox.setFromPoints([_v1.positionScreen, _v2.positionScreen]);

        if (_clipBox.intersectsBox(_elemBox) === !0) {
          renderLine(_v1, _v2, element, material);
        }
      } else if (element instanceof THREE.RenderableFace) {
        _v1 = element.v1;
        _v2 = element.v2;
        _v3 = element.v3;
        if (_v1.positionScreen.z < -1 || _v1.positionScreen.z > 1) continue;
        if (_v2.positionScreen.z < -1 || _v2.positionScreen.z > 1) continue;
        if (_v3.positionScreen.z < -1 || _v3.positionScreen.z > 1) continue;
        _v1.positionScreen.x *= _canvasWidthHalf;
        _v1.positionScreen.y *= _canvasHeightHalf;
        _v2.positionScreen.x *= _canvasWidthHalf;
        _v2.positionScreen.y *= _canvasHeightHalf;
        _v3.positionScreen.x *= _canvasWidthHalf;
        _v3.positionScreen.y *= _canvasHeightHalf;

        if (material.overdraw > 0) {
          expand(_v1.positionScreen, _v2.positionScreen, material.overdraw);
          expand(_v2.positionScreen, _v3.positionScreen, material.overdraw);
          expand(_v3.positionScreen, _v1.positionScreen, material.overdraw);
        }

        _elemBox.setFromPoints([_v1.positionScreen, _v2.positionScreen, _v3.positionScreen]);

        if (_clipBox.intersectsBox(_elemBox) === !0) {
          renderFace3(_v1, _v2, _v3, 0, 1, 2, element, material);
        }
      }

      _clearBox.union(_elemBox);
    }

    _context.setTransform(1, 0, 0, 1, 0, 0);
  };

  function calculateLights() {
    _ambientLight.setRGB(0, 0, 0);

    _directionalLights.setRGB(0, 0, 0);

    _pointLights.setRGB(0, 0, 0);

    for (var l = 0, ll = _lights.length; l < ll; l++) {
      var light = _lights[l];
      var lightColor = light.color;

      if (light instanceof THREE.AmbientLight) {
        _ambientLight.add(lightColor);
      } else if (light instanceof THREE.DirectionalLight) {
        _directionalLights.add(lightColor);
      } else if (light instanceof THREE.PointLight) {
        _pointLights.add(lightColor);
      }
    }
  }

  function calculateLight(position, normal, color) {
    for (var l = 0, ll = _lights.length; l < ll; l++) {
      var light = _lights[l];

      _lightColor.copy(light.color);

      if (light instanceof THREE.DirectionalLight) {
        var lightPosition = _vector3.setFromMatrixPosition(light.matrixWorld).normalize();

        var amount = normal.dot(lightPosition);
        if (amount <= 0) continue;
        amount *= light.intensity;
        color.add(_lightColor.multiplyScalar(amount));
      } else if (light instanceof THREE.PointLight) {
        var lightPosition = _vector3.setFromMatrixPosition(light.matrixWorld);

        var amount = normal.dot(_vector3.subVectors(lightPosition, position).normalize());
        if (amount <= 0) continue;
        amount *= light.distance == 0 ? 1 : 1 - Math.min(position.distanceTo(lightPosition) / light.distance, 1);
        if (amount == 0) continue;
        amount *= light.intensity;
        color.add(_lightColor.multiplyScalar(amount));
      }
    }
  }

  function renderSprite(v1, element, material) {
    setOpacity(material.opacity);
    setBlending(material.blending);
    var scaleX = element.scale.x * _canvasWidthHalf;
    var scaleY = element.scale.y * _canvasHeightHalf;
    var dist = 0.5 * Math.sqrt(scaleX * scaleX + scaleY * scaleY);

    _elemBox.min.set(v1.x - dist, v1.y - dist);

    _elemBox.max.set(v1.x + dist, v1.y + dist);

    if (material instanceof THREE.SpriteMaterial) {
      var texture = material.map;

      if (texture !== null) {
        var pattern = _patterns[texture.id];

        if (pattern === undefined || pattern.version !== texture.version) {
          pattern = textureToPattern(texture);
          _patterns[texture.id] = pattern;
        }

        if (pattern.canvas !== undefined) {
          setFillStyle(pattern.canvas);
          var bitmap = texture.image;
          var ox = bitmap.width * texture.offset.x;
          var oy = bitmap.height * texture.offset.y;
          var sx = bitmap.width * texture.repeat.x;
          var sy = bitmap.height * texture.repeat.y;
          var cx = scaleX / sx;
          var cy = scaleY / sy;

          _context.save();

          _context.translate(v1.x, v1.y);

          if (material.rotation !== 0) _context.rotate(material.rotation);

          _context.translate(-scaleX / 2, -scaleY / 2);

          _context.scale(cx, cy);

          _context.translate(-ox, -oy);

          _context.fillRect(ox, oy, sx, sy);

          _context.restore();
        }
      } else {
        setFillStyle(material.color.getStyle());

        _context.save();

        _context.translate(v1.x, v1.y);

        if (material.rotation !== 0) _context.rotate(material.rotation);

        _context.scale(scaleX, -scaleY);

        _context.fillRect(-0.5, -0.5, 1, 1);

        _context.restore();
      }
    } else if (material instanceof THREE.SpriteCanvasMaterial) {
      setStrokeStyle(material.color.getStyle());
      setFillStyle(material.color.getStyle());

      _context.save();

      _context.translate(v1.x, v1.y);

      if (material.rotation !== 0) _context.rotate(material.rotation);

      _context.scale(scaleX, scaleY);

      material.program(_context);

      _context.restore();
    }
  }

  function renderLine(v1, v2, element, material) {
    setOpacity(material.opacity);
    setBlending(material.blending);

    _context.beginPath();

    _context.moveTo(v1.positionScreen.x, v1.positionScreen.y);

    _context.lineTo(v2.positionScreen.x, v2.positionScreen.y);

    if (material instanceof THREE.LineBasicMaterial) {
      setLineWidth(material.linewidth);
      setLineCap(material.linecap);
      setLineJoin(material.linejoin);

      if (material.vertexColors !== THREE.VertexColors) {
        setStrokeStyle(material.color.getStyle());
      } else {
        var colorStyle1 = element.vertexColors[0].getStyle();
        var colorStyle2 = element.vertexColors[1].getStyle();

        if (colorStyle1 === colorStyle2) {
          setStrokeStyle(colorStyle1);
        } else {
          try {
            var grad = _context.createLinearGradient(v1.positionScreen.x, v1.positionScreen.y, v2.positionScreen.x, v2.positionScreen.y);

            grad.addColorStop(0, colorStyle1);
            grad.addColorStop(1, colorStyle2);
          } catch (exception) {
            grad = colorStyle1;
          }

          setStrokeStyle(grad);
        }
      }

      _context.stroke();

      _elemBox.expandByScalar(material.linewidth * 2);
    } else if (material instanceof THREE.LineDashedMaterial) {
      setLineWidth(material.linewidth);
      setLineCap(material.linecap);
      setLineJoin(material.linejoin);
      setStrokeStyle(material.color.getStyle());
      setLineDash([material.dashSize, material.gapSize]);

      _context.stroke();

      _elemBox.expandByScalar(material.linewidth * 2);

      setLineDash([]);
    }
  }

  function renderFace3(v1, v2, v3, uv1, uv2, uv3, element, material) {
    _this.info.render.vertices += 3;
    _this.info.render.faces++;
    setOpacity(material.opacity);
    setBlending(material.blending);
    _v1x = v1.positionScreen.x;
    _v1y = v1.positionScreen.y;
    _v2x = v2.positionScreen.x;
    _v2y = v2.positionScreen.y;
    _v3x = v3.positionScreen.x;
    _v3y = v3.positionScreen.y;
    drawTriangle(_v1x, _v1y, _v2x, _v2y, _v3x, _v3y);

    if ((material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial) && material.map === null) {
      _diffuseColor.copy(material.color);

      _emissiveColor.copy(material.emissive);

      if (material.vertexColors === THREE.FaceColors) {
        _diffuseColor.multiply(element.color);
      }

      _color.copy(_ambientLight);

      _centroid.copy(v1.positionWorld).add(v2.positionWorld).add(v3.positionWorld).divideScalar(3);

      calculateLight(_centroid, element.normalModel, _color);

      _color.multiply(_diffuseColor).add(_emissiveColor);

      material.wireframe === !0 ? strokePath(_color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin) : fillPath(_color);
    } else if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial) {
      if (material.map !== null) {
        var mapping = material.map.mapping;

        if (mapping === THREE.UVMapping) {
          _uvs = element.uvs;
          patternPath(_v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uvs[uv1].x, _uvs[uv1].y, _uvs[uv2].x, _uvs[uv2].y, _uvs[uv3].x, _uvs[uv3].y, material.map);
        }
      } else if (material.envMap !== null) {
        if (material.envMap.mapping === THREE.SphericalReflectionMapping) {
          _normal.copy(element.vertexNormalsModel[uv1]).applyMatrix3(_normalViewMatrix);

          _uv1x = 0.5 * _normal.x + 0.5;
          _uv1y = 0.5 * _normal.y + 0.5;

          _normal.copy(element.vertexNormalsModel[uv2]).applyMatrix3(_normalViewMatrix);

          _uv2x = 0.5 * _normal.x + 0.5;
          _uv2y = 0.5 * _normal.y + 0.5;

          _normal.copy(element.vertexNormalsModel[uv3]).applyMatrix3(_normalViewMatrix);

          _uv3x = 0.5 * _normal.x + 0.5;
          _uv3y = 0.5 * _normal.y + 0.5;
          patternPath(_v1x, _v1y, _v2x, _v2y, _v3x, _v3y, _uv1x, _uv1y, _uv2x, _uv2y, _uv3x, _uv3y, material.envMap);
        }
      } else {
        _color.copy(material.color);

        if (material.vertexColors === THREE.FaceColors) {
          _color.multiply(element.color);
        }

        material.wireframe === !0 ? strokePath(_color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin) : fillPath(_color);
      }
    } else if (material instanceof THREE.MeshNormalMaterial) {
      _normal.copy(element.normalModel).applyMatrix3(_normalViewMatrix);

      _color.setRGB(_normal.x, _normal.y, _normal.z).multiplyScalar(0.5).addScalar(0.5);

      material.wireframe === !0 ? strokePath(_color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin) : fillPath(_color);
    } else {
      _color.setRGB(1, 1, 1);

      material.wireframe === !0 ? strokePath(_color, material.wireframeLinewidth, material.wireframeLinecap, material.wireframeLinejoin) : fillPath(_color);
    }
  }

  function drawTriangle(x0, y0, x1, y1, x2, y2) {
    _context.beginPath();

    _context.moveTo(x0, y0);

    _context.lineTo(x1, y1);

    _context.lineTo(x2, y2);

    _context.closePath();
  }

  function strokePath(color, linewidth, linecap, linejoin) {
    setLineWidth(linewidth);
    setLineCap(linecap);
    setLineJoin(linejoin);
    setStrokeStyle(color.getStyle());

    _context.stroke();

    _elemBox.expandByScalar(linewidth * 2);
  }

  function fillPath(color) {
    setFillStyle(color.getStyle());

    _context.fill();
  }

  function textureToPattern(texture) {
    if (texture.version === 0 || texture instanceof THREE.CompressedTexture || texture instanceof THREE.DataTexture) {
      return {
        canvas: undefined,
        version: texture.version
      };
    }

    var image = texture.image;

    if (image.complete === !1) {
      return {
        canvas: undefined,
        version: 0
      };
    }

    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    var context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, -1, 0, image.height);
    context.drawImage(image, 0, 0);
    var repeatX = texture.wrapS === THREE.RepeatWrapping;
    var repeatY = texture.wrapT === THREE.RepeatWrapping;
    var repeat = 'no-repeat';

    if (repeatX === !0 && repeatY === !0) {
      repeat = 'repeat';
    } else if (repeatX === !0) {
      repeat = 'repeat-x';
    } else if (repeatY === !0) {
      repeat = 'repeat-y';
    }

    var pattern = _context.createPattern(canvas, repeat);

    if (texture.onUpdate) texture.onUpdate(texture);
    return {
      canvas: pattern,
      version: texture.version
    };
  }

  function patternPath(x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2, texture) {
    var pattern = _patterns[texture.id];

    if (pattern === undefined || pattern.version !== texture.version) {
      pattern = textureToPattern(texture);
      _patterns[texture.id] = pattern;
    }

    if (pattern.canvas !== undefined) {
      setFillStyle(pattern.canvas);
    } else {
      setFillStyle('rgba( 0, 0, 0, 1)');

      _context.fill();

      return;
    }

    var a,
        b,
        c,
        d,
        e,
        f,
        det,
        idet,
        offsetX = texture.offset.x / texture.repeat.x,
        offsetY = texture.offset.y / texture.repeat.y,
        width = texture.image.width * texture.repeat.x,
        height = texture.image.height * texture.repeat.y;
    u0 = (u0 + offsetX) * width;
    v0 = (v0 + offsetY) * height;
    u1 = (u1 + offsetX) * width;
    v1 = (v1 + offsetY) * height;
    u2 = (u2 + offsetX) * width;
    v2 = (v2 + offsetY) * height;
    x1 -= x0;
    y1 -= y0;
    x2 -= x0;
    y2 -= y0;
    u1 -= u0;
    v1 -= v0;
    u2 -= u0;
    v2 -= v0;
    det = u1 * v2 - u2 * v1;
    if (det === 0) return;
    idet = 1 / det;
    a = (v2 * x1 - v1 * x2) * idet;
    b = (v2 * y1 - v1 * y2) * idet;
    c = (u1 * x2 - u2 * x1) * idet;
    d = (u1 * y2 - u2 * y1) * idet;
    e = x0 - a * u0 - c * v0;
    f = y0 - b * u0 - d * v0;

    _context.save();

    _context.transform(a, b, c, d, e, f);

    _context.fill();

    _context.restore();
  }

  function expand(v1, v2, pixels) {
    var x = v2.x - v1.x,
        y = v2.y - v1.y,
        det = x * x + y * y,
        idet;
    if (det === 0) return;
    idet = pixels / Math.sqrt(det);
    x *= idet;
    y *= idet;
    v2.x += x;
    v2.y += y;
    v1.x -= x;
    v1.y -= y;
  }

  function setOpacity(value) {
    if (_contextGlobalAlpha !== value) {
      _context.globalAlpha = value;
      _contextGlobalAlpha = value;
    }
  }

  function setBlending(value) {
    if (_contextGlobalCompositeOperation !== value) {
      if (value === THREE.NormalBlending) {
        _context.globalCompositeOperation = 'source-over';
      } else if (value === THREE.AdditiveBlending) {
        _context.globalCompositeOperation = 'lighter';
      } else if (value === THREE.SubtractiveBlending) {
        _context.globalCompositeOperation = 'darker';
      } else if (value === THREE.MultiplyBlending) {
        _context.globalCompositeOperation = 'multiply';
      }

      _contextGlobalCompositeOperation = value;
    }
  }

  function setLineWidth(value) {
    if (_contextLineWidth !== value) {
      _context.lineWidth = value;
      _contextLineWidth = value;
    }
  }

  function setLineCap(value) {
    if (_contextLineCap !== value) {
      _context.lineCap = value;
      _contextLineCap = value;
    }
  }

  function setLineJoin(value) {
    if (_contextLineJoin !== value) {
      _context.lineJoin = value;
      _contextLineJoin = value;
    }
  }

  function setStrokeStyle(value) {
    if (_contextStrokeStyle !== value) {
      _context.strokeStyle = value;
      _contextStrokeStyle = value;
    }
  }

  function setFillStyle(value) {
    if (_contextFillStyle !== value) {
      _context.fillStyle = value;
      _contextFillStyle = value;
    }
  }

  function setLineDash(value) {
    if (_contextLineDash.length !== value.length) {
      _context.setLineDash(value);

      _contextLineDash = value;
    }
  }
};

THREE.OrbitControls = function (object, domElement) {
  this.object = object;
  this.domElement = domElement !== undefined ? domElement : document;
  this.enabled = !0;
  this.target = new THREE.Vector3();
  this.minDistance = 0;
  this.maxDistance = Infinity;
  this.minZoom = 0;
  this.maxZoom = Infinity;
  this.minPolarAngle = 0;
  this.maxPolarAngle = Math.PI;
  this.minAzimuthAngle = -Infinity;
  this.maxAzimuthAngle = Infinity;
  this.enableDamping = !1;
  this.dampingFactor = 0.25;
  this.enableZoom = !0;
  this.zoomSpeed = 1.0;
  this.enableRotate = !0;
  this.rotateSpeed = 1.0;
  this.enablePan = !0;
  this.keyPanSpeed = 7.0;
  this.autoRotate = !1;
  this.autoRotateSpeed = 2.0;
  this.enableKeys = !0;
  this.keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40
  };
  this.mouseButtons = {
    ORBIT: THREE.MOUSE.LEFT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.RIGHT
  };
  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.zoom0 = this.object.zoom;

  this.getPolarAngle = function () {
    return spherical.phi;
  };

  this.getAzimuthalAngle = function () {
    return spherical.theta;
  };

  this.reset = function () {
    scope.target.copy(scope.target0);
    scope.object.position.copy(scope.position0);
    scope.object.zoom = scope.zoom0;
    scope.object.updateProjectionMatrix();
    scope.dispatchEvent(changeEvent);
    scope.update();
    state = STATE.NONE;
  };

  this.update = function () {
    var offset = new THREE.Vector3();
    var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
    var quatInverse = quat.clone().inverse();
    var lastPosition = new THREE.Vector3();
    var lastQuaternion = new THREE.Quaternion();
    return function update() {
      var position = scope.object.position;
      offset.copy(position).sub(scope.target);
      offset.applyQuaternion(quat);
      spherical.setFromVector3(offset);

      if (scope.autoRotate && state === STATE.NONE) {
        rotateLeft(getAutoRotationAngle());
      }

      spherical.theta += sphericalDelta.theta;
      spherical.phi += sphericalDelta.phi;
      spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));
      spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));
      spherical.makeSafe();
      spherical.radius *= scale;
      spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
      scope.target.add(panOffset);
      offset.setFromSpherical(spherical);
      offset.applyQuaternion(quatInverse);
      position.copy(scope.target).add(offset);
      scope.object.lookAt(scope.target);

      if (scope.enableDamping === !0) {
        sphericalDelta.theta *= 1 - scope.dampingFactor;
        sphericalDelta.phi *= 1 - scope.dampingFactor;
      } else {
        sphericalDelta.set(0, 0, 0);
      }

      scale = 1;
      panOffset.set(0, 0, 0);

      if (zoomChanged || lastPosition.distanceToSquared(scope.object.position) > EPS || 8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS) {
        scope.dispatchEvent(changeEvent);
        lastPosition.copy(scope.object.position);
        lastQuaternion.copy(scope.object.quaternion);
        zoomChanged = !1;
        return !0;
      }

      return !1;
    };
  }();

  this.dispose = function () {
    scope.domElement.removeEventListener('contextmenu', onContextMenu, !1);
    scope.domElement.removeEventListener('mousedown', onMouseDown, !1);
    scope.domElement.removeEventListener('wheel', onMouseWheel, !1);
    scope.domElement.removeEventListener('touchstart', onTouchStart, !1);
    scope.domElement.removeEventListener('touchend', onTouchEnd, !1);
    scope.domElement.removeEventListener('touchmove', onTouchMove, !1);
    document.removeEventListener('mousemove', onMouseMove, !1);
    document.removeEventListener('mouseup', onMouseUp, !1);
    window.removeEventListener('keydown', onKeyDown, !1);
  };

  var scope = this;
  var changeEvent = {
    type: 'change'
  };
  var startEvent = {
    type: 'start'
  };
  var endEvent = {
    type: 'end'
  };
  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY: 4,
    TOUCH_PAN: 5
  };
  var state = STATE.NONE;
  var EPS = 0.000001;
  var spherical = new THREE.Spherical();
  var sphericalDelta = new THREE.Spherical();
  var scale = 1;
  var panOffset = new THREE.Vector3();
  var zoomChanged = !1;
  var rotateStart = new THREE.Vector2();
  var rotateEnd = new THREE.Vector2();
  var rotateDelta = new THREE.Vector2();
  var panStart = new THREE.Vector2();
  var panEnd = new THREE.Vector2();
  var panDelta = new THREE.Vector2();
  var dollyStart = new THREE.Vector2();
  var dollyEnd = new THREE.Vector2();
  var dollyDelta = new THREE.Vector2();

  function getAutoRotationAngle() {
    return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
  }

  function getZoomScale() {
    return Math.pow(0.95, scope.zoomSpeed);
  }

  function rotateLeft(angle) {
    sphericalDelta.theta -= angle;
  }

  function rotateUp(angle) {
    sphericalDelta.phi -= angle;
  }

  var panLeft = function () {
    var v = new THREE.Vector3();
    return function panLeft(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0);
      v.multiplyScalar(-distance);
      panOffset.add(v);
    };
  }();

  var panUp = function () {
    var v = new THREE.Vector3();
    return function panUp(distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 1);
      v.multiplyScalar(distance);
      panOffset.add(v);
    };
  }();

  var pan = function () {
    var offset = new THREE.Vector3();
    return function pan(deltaX, deltaY) {
      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

      if (scope.object instanceof THREE.PerspectiveCamera) {
        var position = scope.object.position;
        offset.copy(position).sub(scope.target);
        var targetDistance = offset.length();
        targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180.0);
        panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
        panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
      } else if (scope.object instanceof THREE.OrthographicCamera) {
        panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
        panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
      } else {
        console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
        scope.enablePan = !1;
      }
    };
  }();

  function dollyIn(dollyScale) {
    if (scope.object instanceof THREE.PerspectiveCamera) {
      scale /= dollyScale;
    } else if (scope.object instanceof THREE.OrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom * dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = !0;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = !1;
    }
  }

  function dollyOut(dollyScale) {
    if (scope.object instanceof THREE.PerspectiveCamera) {
      scale *= dollyScale;
    } else if (scope.object instanceof THREE.OrthographicCamera) {
      scope.object.zoom = Math.max(scope.minZoom, Math.min(scope.maxZoom, scope.object.zoom / dollyScale));
      scope.object.updateProjectionMatrix();
      zoomChanged = !0;
    } else {
      console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
      scope.enableZoom = !1;
    }
  }

  function handleMouseDownRotate(event) {
    rotateStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownDolly(event) {
    dollyStart.set(event.clientX, event.clientY);
  }

  function handleMouseDownPan(event) {
    panStart.set(event.clientX, event.clientY);
  }

  function handleMouseMoveRotate(event) {
    rotateEnd.set(event.clientX, event.clientY);
    rotateDelta.subVectors(rotateEnd, rotateStart);
    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
    rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
    rotateStart.copy(rotateEnd);
    scope.update();
  }

  function handleMouseMoveDolly(event) {
    dollyEnd.set(event.clientX, event.clientY);
    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyIn(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyOut(getZoomScale());
    }

    dollyStart.copy(dollyEnd);
    scope.update();
  }

  function handleMouseMovePan(event) {
    panEnd.set(event.clientX, event.clientY);
    panDelta.subVectors(panEnd, panStart);
    pan(panDelta.x, panDelta.y);
    panStart.copy(panEnd);
    scope.update();
  }

  function handleMouseWheel(event) {
    if (event.deltaY < 0) {
      dollyOut(getZoomScale());
    } else if (event.deltaY > 0) {
      dollyIn(getZoomScale());
    }

    scope.update();
  }

  function handleKeyDown(event) {
    switch (event.keyCode) {
      case scope.keys.UP:
        pan(0, scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.BOTTOM:
        pan(0, -scope.keyPanSpeed);
        scope.update();
        break;

      case scope.keys.LEFT:
        pan(scope.keyPanSpeed, 0);
        scope.update();
        break;

      case scope.keys.RIGHT:
        pan(-scope.keyPanSpeed, 0);
        scope.update();
        break;
    }
  }

  function handleTouchStartRotate(event) {
    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  function handleTouchStartDolly(event) {
    var dx = event.touches[0].pageX - event.touches[1].pageX;
    var dy = event.touches[0].pageY - event.touches[1].pageY;
    var distance = Math.sqrt(dx * dx + dy * dy);
    dollyStart.set(0, distance);
  }

  function handleTouchStartPan(event) {
    panStart.set(event.touches[0].pageX, event.touches[0].pageY);
  }

  function handleTouchMoveRotate(event) {
    rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    rotateDelta.subVectors(rotateEnd, rotateStart);
    var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
    rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);
    rotateStart.copy(rotateEnd);
    scope.update();
  }

  function handleTouchMoveDolly(event) {
    var dx = event.touches[0].pageX - event.touches[1].pageX;
    var dy = event.touches[0].pageY - event.touches[1].pageY;
    var distance = Math.sqrt(dx * dx + dy * dy);
    dollyEnd.set(0, distance);
    dollyDelta.subVectors(dollyEnd, dollyStart);

    if (dollyDelta.y > 0) {
      dollyOut(getZoomScale());
    } else if (dollyDelta.y < 0) {
      dollyIn(getZoomScale());
    }

    dollyStart.copy(dollyEnd);
    scope.update();
  }

  function handleTouchMovePan(event) {
    panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
    panDelta.subVectors(panEnd, panStart);
    pan(panDelta.x, panDelta.y);
    panStart.copy(panEnd);
    scope.update();
  }

  function onMouseDown(event) {
    if (scope.enabled === !1) return;
    event.preventDefault();

    if (event.button === scope.mouseButtons.ORBIT) {
      if (scope.enableRotate === !1) return;
      handleMouseDownRotate(event);
      state = STATE.ROTATE;
    } else if (event.button === scope.mouseButtons.ZOOM) {
      if (scope.enableZoom === !1) return;
      handleMouseDownDolly(event);
      state = STATE.DOLLY;
    } else if (event.button === scope.mouseButtons.PAN) {
      if (scope.enablePan === !1) return;
      handleMouseDownPan(event);
      state = STATE.PAN;
    }

    if (state !== STATE.NONE) {
      document.addEventListener('mousemove', onMouseMove, !1);
      document.addEventListener('mouseup', onMouseUp, !1);
      scope.dispatchEvent(startEvent);
    }
  }

  function onMouseMove(event) {
    if (scope.enabled === !1) return;
    event.preventDefault();

    if (state === STATE.ROTATE) {
      if (scope.enableRotate === !1) return;
      handleMouseMoveRotate(event);
    } else if (state === STATE.DOLLY) {
      if (scope.enableZoom === !1) return;
      handleMouseMoveDolly(event);
    } else if (state === STATE.PAN) {
      if (scope.enablePan === !1) return;
      handleMouseMovePan(event);
    }
  }

  function onMouseUp(event) {
    if (scope.enabled === !1) return;
    document.removeEventListener('mousemove', onMouseMove, !1);
    document.removeEventListener('mouseup', onMouseUp, !1);
    scope.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function onMouseWheel(event) {
    if (scope.enabled === !1 || scope.enableZoom === !1 || state !== STATE.NONE && state !== STATE.ROTATE) return;
    event.preventDefault();
    event.stopPropagation();
    handleMouseWheel(event);
    scope.dispatchEvent(startEvent);
    scope.dispatchEvent(endEvent);
  }

  function onKeyDown(event) {
    if (scope.enabled === !1 || scope.enableKeys === !1 || scope.enablePan === !1) return;
    handleKeyDown(event);
  }

  function onTouchStart(event) {
    if (scope.enabled === !1) return;

    switch (event.touches.length) {
      case 1:
        if (scope.enableRotate === !1) return;
        handleTouchStartRotate(event);
        state = STATE.TOUCH_ROTATE;
        break;

      case 2:
        if (scope.enableZoom === !1) return;
        handleTouchStartDolly(event);
        state = STATE.TOUCH_DOLLY;
        break;

      case 3:
        if (scope.enablePan === !1) return;
        handleTouchStartPan(event);
        state = STATE.TOUCH_PAN;
        break;

      default:
        state = STATE.NONE;
    }

    if (state !== STATE.NONE) {
      scope.dispatchEvent(startEvent);
    }
  }

  function onTouchMove(event) {
    if (scope.enabled === !1) return;
    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1:
        if (scope.enableRotate === !1) return;
        if (state !== STATE.TOUCH_ROTATE) return;
        handleTouchMoveRotate(event);
        break;

      case 2:
        if (scope.enableZoom === !1) return;
        if (state !== STATE.TOUCH_DOLLY) return;
        handleTouchMoveDolly(event);
        break;

      case 3:
        if (scope.enablePan === !1) return;
        if (state !== STATE.TOUCH_PAN) return;
        handleTouchMovePan(event);
        break;

      default:
        state = STATE.NONE;
    }
  }

  function onTouchEnd(event) {
    if (scope.enabled === !1) return;
    scope.dispatchEvent(endEvent);
    state = STATE.NONE;
  }

  function onContextMenu(event) {
    event.preventDefault();
  }

  scope.domElement.addEventListener('contextmenu', onContextMenu, !1);
  scope.domElement.addEventListener('mousedown', onMouseDown, !1);
  scope.domElement.addEventListener('wheel', onMouseWheel, !1);
  scope.domElement.addEventListener('touchstart', onTouchStart, !1);
  scope.domElement.addEventListener('touchend', onTouchEnd, !1);
  scope.domElement.addEventListener('touchmove', onTouchMove, !1);
  window.addEventListener('keydown', onKeyDown, !1);
  this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;
Object.defineProperties(THREE.OrbitControls.prototype, {
  center: {
    get: function get() {
      console.warn('THREE.OrbitControls: .center has been renamed to .target');
      return this.target;
    }
  },
  noZoom: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      return !this.enableZoom;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
      this.enableZoom = !value;
    }
  },
  noRotate: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      return !this.enableRotate;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
      this.enableRotate = !value;
    }
  },
  noPan: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      return !this.enablePan;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
      this.enablePan = !value;
    }
  },
  noKeys: {
    get: function get() {
      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      return !this.enableKeys;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
      this.enableKeys = !value;
    }
  },
  staticMoving: {
    get: function get() {
      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      return !this.enableDamping;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
      this.enableDamping = !value;
    }
  },
  dynamicDampingFactor: {
    get: function get() {
      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      return this.dampingFactor;
    },
    set: function set(value) {
      console.warn('THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
      this.dampingFactor = value;
    }
  }
});

var PI2 = Math.PI * 2;

var isEmpty = (function (value) {
  return value === undefined || value === null || typeof value === 'object' && Object.keys(value).length === 0 || typeof value === 'string' && value.trim().length === 0;
});

var ctx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = ctx.createAnalyser();

if (AnalyserNode && isEmpty(AnalyserNode.prototype.getFloatTimeDomainData)) {
  var uint8 = new Uint8Array(2048);

  AnalyserNode.prototype.getFloatTimeDomainData = function (array) {
    this.getByteTimeDomainData(uint8);

    for (var i = 0, imax = array.length; i < imax; i++) {
      array[i] = (uint8[i] - 128) * 0.0078125;
    }
  };
}

var styles = {"test":"_styles-module__test__3ybTi","circle":"_styles-module__circle__3PfrK"};

var camera, scene, renderer, canvas;
var particles = [];
var circleCounter;
var parent;
var settings;

var App = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(App, _React$Component);

  function App(props) {
    var _this;

    _this = _React$Component.call(this, props) || this;

    _this.animate = function () {
      requestAnimationFrame(_this.animate);

      _this.animateParticles();

      _this.changeCircleRadius();

      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };

    _this.state = {
      source: {}
    };
    return _this;
  }

  var _proto = App.prototype;

  _proto.componentDidMount = function componentDidMount() {
    settings = {
      R: 0.7,
      G: 0,
      B: 0.7,
      fov: 50,
      intensity: 0.08,
      radius: 65,
      minRadius: 35,
      maxRadius: 65,
      animate: true
    };
    this.setupRendering();
    this.setupParticles();
    this.setupEventHandlers();
    this.animate();
  };

  _proto.setupRendering = function setupRendering() {
    parent = this.poop.parentElement;
    scene = new THREE.Scene();
    var cameraSettings = {
      fov: 20,
      width: parent.clientWidth,
      height: parent.clientHeight
    };
    camera = new THREE.PerspectiveCamera(cameraSettings.fov, cameraSettings.width / cameraSettings.height, 1, 10000);
    camera.position.set(0, 0, 175);
    renderer = new THREE.CanvasRenderer({
      alpha: true
    });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    renderer.setClearColor(0x000000, 0);
    canvas = renderer.domElement;
    this.poop.appendChild(canvas);
  };

  _proto.setupParticles = function setupParticles() {
    var particle;

    for (var i = 0; i <= 2048; i++) {
      var material = new THREE.SpriteCanvasMaterial({
        color: 0x000000,
        program: function program(context) {
          context.beginPath();
          context.arc(0, 0, 0.33, 0, PI2);
          context.fill();
        }
      });
      particle = particles[i++] = new THREE.Particle(material);
      scene.add(particle);
    }
  };

  _proto.changeCircleRadius = function changeCircleRadius() {
    if (settings.animate) {
      if (circleCounter) {
        settings.radius += 0.05;

        if (settings.radius >= settings.maxRadius) {
          circleCounter = false;
        }
      } else {
        settings.radius -= 0.05;

        if (settings.radius <= settings.minRadius) {
          console.log("hit");
          circleCounter = true;
        }
      }
    }
  };

  _proto.animateParticles = function animateParticles() {
    var _settings = settings,
        radius = _settings.radius,
        intensity = _settings.intensity;
    var timeByteData = new Uint8Array(analyser.fftSize);
    var timeFloatData = new Float32Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeByteData);
    analyser.getFloatTimeDomainData(timeFloatData);

    for (var j = 0; j <= particles.length; j++) {
      var particle = particles[j++];
      var R = settings.R + timeFloatData[j];
      var G = settings.G - timeFloatData[j];
      var B = settings.B - timeFloatData[j];
      particle.material.color.setRGB(R, G, B);
      particle.position.x = Math.sin(j) * (j / (j / radius));
      particle.position.y = timeFloatData[j] * timeByteData[j] * intensity;
      particle.position.z = Math.cos(j) * (j / (j / radius));
      camera.position.y = 80;
      camera.fov = 35;
    }

    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
  };

  _proto.windowResize = function windowResize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    width = parent.clientWidth;
    height = parent.clientHeight;
    console.log({
      width: width,
      height: height
    }, settings.radius);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  _proto.setupEventHandlers = function setupEventHandlers() {
    var ref = this.props.audioRef2 || this.props.audioRef;
    var audio = ref.current;
    var source = ctx.createMediaElementSource(audio);
    audio.addEventListener("play", function () {
      console.log("PLAY event");
    });
    audio.addEventListener("pause", function () {
      console.log("PAUSE event");
    });
    audio.addEventListener("loadeddata", function () {
      console.log("LOADED_DATA event");
      source.connect(ctx.destination);
      source.connect(analyser);
    });
    audio.addEventListener("ended", function () {
      console.log("ENDED event");
    });
    window.addEventListener("resize", this.windowResize, false);
  };

  _proto.render = function render() {
    var _this2 = this;

    return /*#__PURE__*/React.createElement("div", {
      className: styles.circle,
      ref: function ref(_ref) {
        return _this2.poop = _ref;
      }
    });
  };

  return App;
}(React.Component);

var Spiral = React.forwardRef(function (props, ref) {
  return /*#__PURE__*/React.createElement(App, _extends({
    audioRef2: ref
  }, props));
});

module.exports = Spiral;
//# sourceMappingURL=index.js.map
