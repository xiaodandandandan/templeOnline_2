  // 唯一的人物模型：现代 Anime 风格，动画节点由建模函数返回。

  // ==================== Anime 风格现代服饰人物模型 ====================
  function createAnimeAvatar() {
    const body = new T.Group();
    const arms = [], legs = [], knees = [], elbows = [];
    const head = new T.Group();
    body.visible = false;
    new GLTFLoader().loadAsync('/temple/avatar-rigged.glb').then(({ scene: model }) => {
      const bounds = new T.Box3().setFromObject(model);
      const size = bounds.getSize(new T.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('人物模型高度无效');
      const scale = 2.72 / size.y;
      model.scale.setScalar(scale);
      const center = bounds.getCenter(new T.Vector3());
      model.position.set(-center.x * scale, -bounds.min.y * scale - 1.38, -center.z * scale);
      model.traverse((part) => {
        if (part.isBone) {
          part.userData.restRotation = part.rotation.clone();
          if (/UpperArm$/.test(part.name)) arms.push(part);
          if (/UpLeg$/.test(part.name)) legs.push(part);
          if (/^(Left|Right)Leg$/.test(part.name)) knees.push(part);
          if (/ForeArm$/.test(part.name)) elbows.push(part);
        }
        if (part.isMesh) {
          part.castShadow = false;
          part.receiveShadow = true;
        }
      });
      body.add(model);
      body.visible = true;
    }).catch((error) => send({ evt: 'error', message: '人物模型加载失败：' + error.message }));
    return { body, lower: new T.Group(), head, arms, legs, knees, elbows };
  }

  const avatar = new T.Group();
  const { body, lower, head, arms, legs, knees, elbows } = createAnimeAvatar();
  // 模型五官朝 +Z；运行时 yaw=0 的前进方向是 -Z。
  body.rotation.y = Math.PI;
  lower.rotation.y = Math.PI;
  body.position.y = 1.38;
  lower.position.y = 1.38;
  avatar.add(body);
  avatar.add(lower);

  // 方形脚影（不投影，避免俯瞰出现细长阴影）
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1.2, 1.2),
    new T.MeshBasicMaterial({ color: 0x2b211c, transparent: true, opacity: 0.17, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  avatar.add(shadow);

  scene.add(avatar);

