  function updateAnimation(stamp, kneelP, kneeling) {
    // 行走 / 跪拜动画：屈膝 → 俯身叩首 → 保持 → 起身复位（全程 3.2s）
    const t = stamp / 1000;
    const ease = (v) => v * v * (3 - 2 * v);
    const k = kneelP < 0.22 ? ease(kneelP / 0.22)
      : kneelP < 0.70 ? 1
      : 1 - ease((kneelP - 0.70) / 0.30);
    const b = ease(clamp((kneelP - 0.22) / 0.26, 0, 1))
      - ease(clamp((kneelP - 0.70) / 0.30, 0, 1));
    const swing = A.moving ? Math.sin(t * 9) : 0;

    body.position.y = 1.38 + (A.moving ? Math.abs(swing) * 0.05 : 0) - k * 0.34;
    lower.position.y = 1.38 - k * 0.20;
    body.rotation.x = -b * 0.88;
    body.rotation.z = A.moving ? swing * 0.035 : 0;
    head.rotation.x = -b * 0.22;
    legs.forEach((leg, i) => {
      leg.rotation.x = leg.userData.restRotation.x + (kneeling ? -k * 1.15 : swing * (i ? -0.55 : 0.55));
    });
    arms.forEach((arm, i) => {
      arm.rotation.x = arm.userData.restRotation.x + (kneeling ? 0.35 * k + 1.15 * b : swing * (i ? -0.45 : 0.45));
      arm.rotation.z = arm.userData.restRotation.z + (kneeling ? (i ? 0.26 : -0.26) * k : (i ? -0.04 : 0.04));
    });
    knees.forEach((joint, i) => {
      joint.rotation.x = joint.userData.restRotation.x + (kneeling ? k * 1.65 : Math.max(0, swing * (i ? -1 : 1)) * 0.55);
    });
    elbows.forEach((joint) => { joint.rotation.x = joint.userData.restRotation.x + (kneeling ? -b * 0.65 : -0.12); });

    return k;
  }
