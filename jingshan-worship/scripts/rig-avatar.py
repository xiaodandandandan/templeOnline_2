"""Build a humanoid armature and export a skinned GLB using Blender."""
import bpy
import numpy as np
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root / 'assets/avatar.glb'))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
for mesh in meshes:
    bpy.context.view_layer.objects.active = mesh
    mesh.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    modifier = mesh.modifiers.new('Animation topology', 'DECIMATE')
    modifier.ratio = 0.08
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    mesh.select_set(False)
points = [o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
height = hi.z - lo.z
center = (lo + hi) / 2
def point(x, z, y=0):
    return (center.x + x * height, center.y + y * height, lo.z + z * height)
bpy.ops.object.armature_add()
armature = bpy.context.object
armature.name = 'AvatarRig'
bpy.ops.object.mode_set(mode='EDIT')
armature.data.edit_bones.remove(armature.data.edit_bones[0])
def bone(name, start, end, parent=None):
    b = armature.data.edit_bones.new(name)
    b.head = point(*start)
    b.tail = point(*end)
    if parent:
        b.parent = armature.data.edit_bones[parent]
bone('Hips', (0,.43), (0,.51))
bone('Spine', (0,.51), (0,.63), 'Hips')
bone('Chest', (0,.63), (0,.74), 'Spine')
bone('Neck', (0,.74), (0,.79), 'Chest')
bone('Head', (0,.79), (0,.96), 'Neck')
for side, sign in [('Left',1), ('Right',-1)]:
    bone(side+'UpperArm', (sign*.13,.71), (sign*.16,.57), 'Chest')
    bone(side+'ForeArm', (sign*.16,.57), (sign*.17,.45), side+'UpperArm')
    bone(side+'Hand', (sign*.17,.45), (sign*.17,.40), side+'ForeArm')
    bone(side+'UpLeg', (sign*.07,.44), (sign*.07,.24), 'Hips')
    bone(side+'Leg', (sign*.07,.24), (sign*.07,.06), side+'UpLeg')
    bone(side+'Foot', (sign*.07,.06), (sign*.07,.03,-.07), side+'Leg')
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
for mesh in meshes:
    mesh.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
for mesh in meshes:
    if any(not v.groups for v in mesh.data.vertices):
        # Non-manifold generated surfaces can defeat heat weights. Bind all
        # vertices consistently to the nearest four bone segments instead.
        mesh.vertex_groups.clear()
        bones = list(armature.data.bones)
        groups = [mesh.vertex_groups.new(name=b.name) for b in bones]
        coords = np.array([mesh.matrix_world @ v.co for v in mesh.data.vertices])
        distances = []
        for b in bones:
            start = np.array(armature.matrix_world @ b.head_local)
            end = np.array(armature.matrix_world @ b.tail_local)
            segment = end - start
            t = np.clip((coords-start) @ segment / np.dot(segment, segment), 0, 1)
            distances.append(np.sum((coords-start-t[:,None]*segment)**2, axis=1))
        distances = np.array(distances).T
        indices = np.argsort(distances, axis=1)[:,:4]
        nearest = np.take_along_axis(distances, indices, axis=1)
        weights = np.exp(-(nearest-nearest[:,0:1]) / (height*.035)**2)
        weights /= weights.sum(axis=1, keepdims=True)
        for i in range(len(coords)):
            for index, weight in zip(indices[i], weights[i]):
                groups[int(index)].add([i], float(weight), 'REPLACE')
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'assets/avatar-rigged.blend'))
bpy.ops.export_scene.gltf(filepath=str(root / 'assets/avatar-rigged.glb'), export_format='GLB', use_selection=True)
print('RIG_EXPORT_COMPLETE', len(armature.data.bones), sum(len(o.data.vertices) for o in meshes))
