/* global React, THREE */
const { useEffect: useEffectG, useRef: useRefG } = React;

// ─── Cinematic wireframe globe + satellites + threats ─────
function WireframeGlobe({ height = "100%" }) {
  const mountRef = useRefG(null);

  useEffectG(() => {
    if (!window.THREE) return;
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth, h = mount.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.018);

    const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 200);
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 1);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const R = 7;

    // ── 1. Subtle solid sphere (slightly visible to occlude back-side points) ──
    const solid = new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x05080c, transparent: true, opacity: 0.92 })
    );
    group.add(solid);

    // ── 2. Wireframe icosahedron (advanced mesh look) ──
    const wireGeo = new THREE.IcosahedronGeometry(R, 5);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x5fb8e6, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(wireGeo), wireMat);
    group.add(wire);

    // ── 3. Secondary lat/long wire ──
    const wireGeo2 = new THREE.SphereGeometry(R * 1.001, 36, 24);
    const wire2 = new THREE.LineSegments(
      new THREE.WireframeGeometry(wireGeo2),
      new THREE.LineBasicMaterial({ color: 0x88c8ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(wire2);

    // ── 4. Dense surface point cloud (fibonacci sphere) ──
    const N_POINTS = 1800;
    const pts = new Float32Array(N_POINTS * 3);
    const phi0 = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N_POINTS; i++) {
      const y = 1 - (i / (N_POINTS - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi0 * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts[i * 3] = x * R * 1.005;
      pts[i * 3 + 1] = y * R * 1.005;
      pts[i * 3 + 2] = z * R * 1.005;
    }
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const cloud = new THREE.Points(ptsGeo, new THREE.PointsMaterial({
      color: 0xa9d8ff, size: 0.06, transparent: true, opacity: 0.7,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(cloud);

    // ── 5. Threat (red) + asset (blue) markers at fixed lat/long ──
    const sites = [
      { lat: 25.2,  lon: 55.3,  kind: "red"  }, // Dubai region (threat)
      { lat: 26.5,  lon: 56.3,  kind: "red"  }, // Hormuz
      { lat: 13.1,  lon: 80.3,  kind: "blue" }, // Chennai
      { lat: 28.6,  lon: 77.2,  kind: "blue" }, // Delhi
      { lat: 12.9,  lon: 77.6,  kind: "blue" }, // Bengaluru
      { lat: 19.0,  lon: 72.8,  kind: "blue" }, // Mumbai
      { lat: -33.9, lon: 18.4,  kind: "red"  }, // Cape Town
      { lat: 35.7,  lon: 139.7, kind: "blue" }, // Tokyo
      { lat: 40.7,  lon: -74.0, kind: "blue" }, // NY
      { lat: 51.5,  lon: -0.1,  kind: "blue" }, // London
      { lat: 55.7,  lon: 37.6,  kind: "red"  }, // Moscow
      { lat: 39.9,  lon: 116.4, kind: "red"  }, // Beijing
      { lat: -1.3,  lon: 36.8,  kind: "red"  }, // Nairobi
      { lat: -34.6, lon: -58.4, kind: "blue" }, // Buenos Aires
      { lat: 30.0,  lon: 31.2,  kind: "red"  }, // Cairo
      { lat: 33.5,  lon: 44.4,  kind: "red"  }, // Baghdad
      { lat: 34.0,  lon: -118.2, kind: "blue" }, // LA
      { lat: -22.9, lon: -43.2, kind: "blue" }, // Rio
      { lat: 1.3,   lon: 103.8, kind: "blue" }, // Singapore
      { lat: 41.0,  lon: 28.9,  kind: "red"  }, // Istanbul
      { lat: 31.2,  lon: 121.5, kind: "red"  }, // Shanghai
      { lat: 22.3,  lon: 114.2, kind: "red"  }, // HK
      { lat: 24.5,  lon: 54.4,  kind: "blue" }, // Abu Dhabi
      { lat: 15.5,  lon: 32.5,  kind: "red"  }, // Khartoum
    ];

    function latLonToVec3(lat, lon, r) {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
         r * Math.cos(phi),
         r * Math.sin(phi) * Math.sin(theta)
      );
    }

    const markerMeshes = [];
    sites.forEach((s, i) => {
      const c = s.kind === "red" ? 0xff4a4a : 0x5fc8ff;
      const v = latLonToVec3(s.lat, s.lon, R * 1.01);

      // base point
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 12, 12),
        new THREE.MeshBasicMaterial({ color: c })
      );
      dot.position.copy(v);
      group.add(dot);

      // pulse ring (a billboard ring that scales)
      const ringGeo = new THREE.RingGeometry(0.12, 0.14, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(v);
      ring.lookAt(0, 0, 0);
      ring.rotateX(Math.PI / 2);
      group.add(ring);

      // vertical spike (data point indicator)
      const spikeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.8, 6);
      const spikeMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending, depthWrite: false });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.copy(v.clone().multiplyScalar(1.05));
      spike.lookAt(v.clone().multiplyScalar(2));
      spike.rotateX(Math.PI / 2);
      group.add(spike);

      markerMeshes.push({ ring, dot, phase: i * 0.31 });
    });

    // ── 6. Arc connections between selected sites ──
    function makeArc(a, b, color) {
      const A = latLonToVec3(a.lat, a.lon, R * 1.01);
      const B = latLonToVec3(b.lat, b.lon, R * 1.01);
      const mid = A.clone().add(B).multiplyScalar(0.5);
      const dist = A.distanceTo(B);
      mid.normalize().multiplyScalar(R + dist * 0.45);
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      const points = curve.getPoints(64);
      const g = new THREE.BufferGeometry().setFromPoints(points);
      const m = new THREE.LineBasicMaterial({
        color, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      return new THREE.Line(g, m);
    }
    const arcs = [
      [sites[2], sites[3], 0x5fc8ff], [sites[3], sites[4], 0x5fc8ff],
      [sites[4], sites[5], 0x5fc8ff], [sites[5], sites[3], 0x5fc8ff],
      [sites[3], sites[7], 0x5fc8ff], [sites[3], sites[9], 0x5fc8ff],
      [sites[0], sites[1], 0xff4a4a], [sites[11], sites[10], 0xff4a4a],
      [sites[19], sites[21], 0xff4a4a],
    ];
    arcs.forEach(([a, b, c]) => group.add(makeArc(a, b, c)));

    // ── 7. Orbiting satellites ──
    const satellites = [];
    const orbitRings = 4;
    const satsPerRing = 7;
    for (let r = 0; r < orbitRings; r++) {
      const tilt = (r - orbitRings / 2) * 0.45;
      const orbitR = R + 1.6 + r * 0.55;

      // orbit ring line
      const ringPts = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR));
      }
      const ringLineGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringLine = new THREE.Line(ringLineGeo, new THREE.LineBasicMaterial({
        color: 0x6aa8d8, transparent: true, opacity: 0.18,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      ringLine.rotation.x = tilt;
      ringLine.rotation.z = r * 0.7;
      group.add(ringLine);

      for (let i = 0; i < satsPerRing; i++) {
        const offset = (i / satsPerRing) * Math.PI * 2;
        const sat = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.18),
          new THREE.MeshBasicMaterial({ color: 0xcfe8ff })
        );
        // small "solar panels"
        const panel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.34, 0.08),
          new THREE.MeshBasicMaterial({ color: 0x88aacc, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        sat.add(panel);
        const container = new THREE.Group();
        container.add(sat);
        container.rotation.x = tilt;
        container.rotation.z = r * 0.7;
        group.add(container);
        satellites.push({ container, sat, orbitR, offset, speed: 0.18 + r * 0.04 });
      }
    }

    // ── 8. Dust / stars far background ──
    const starN = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const u = Math.random(), v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const rr = 60 + Math.random() * 30;
      starPos[i*3]   = rr * Math.sin(phi) * Math.cos(theta);
      starPos[i*3+1] = rr * Math.cos(phi);
      starPos[i*3+2] = rr * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.08, transparent: true, opacity: 0.42, depthWrite: false,
    }));
    scene.add(stars);

    // ── 9. Outer atmosphere glow (additive) ──
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.10, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x4aa8d8, transparent: true, opacity: 0.05,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      })
    );
    group.add(halo);
    const halo2 = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.04, 48, 48),
      new THREE.MeshBasicMaterial({
        color: 0x6fc0ff, transparent: true, opacity: 0.08,
        blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false,
      })
    );
    group.add(halo2);

    // Initial tilt — axial tilt feel
    group.rotation.z = 0.18;
    group.rotation.x = 0.15;

    let raf;
    let lastT = performance.now();
    const start = lastT;

    function tick(now) {
      const dt = Math.min(50, now - lastT) / 1000;
      lastT = now;
      const t = (now - start) / 1000;

      // slow rotation
      group.rotation.y += dt * 0.08;
      stars.rotation.y -= dt * 0.005;

      // pulse markers
      markerMeshes.forEach((m, i) => {
        const phase = (t * 1.1 + m.phase) % 2.6;
        const s = 1 + phase * 4.5;
        m.ring.scale.setScalar(s);
        m.ring.material.opacity = Math.max(0, 0.7 - phase / 2.6);
      });

      // move satellites
      satellites.forEach((s) => {
        const a = t * s.speed + s.offset;
        s.sat.position.set(Math.cos(a) * s.orbitR, 0, Math.sin(a) * s.orbitR);
        s.sat.rotation.y = -a + Math.PI / 2;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function onResize() {
      if (!mount) return;
      const W = mount.clientWidth, H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      try { mount.removeChild(renderer.domElement); } catch (e) {}
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose && o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose && m.dispose());
          else o.material.dispose && o.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div ref={mountRef} style={{
      position: "absolute", inset: 0, height,
      background: "#000",
    }} />
  );
}

window.WireframeGlobe = WireframeGlobe;
