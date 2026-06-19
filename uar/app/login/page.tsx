"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, User, AlertCircle, Eye, EyeOff, Briefcase, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiFetch, apiAxios } from "@/lib/api";
import { useRouter } from "next/navigation";

function GlobeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      const THREE = (window as any).THREE;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.8;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
      camera.position.z = 2.6;

      // Lighting — sun from upper right
      scene.add(new THREE.AmbientLight(0x111133, 2.0));
      const sun = new THREE.DirectionalLight(0xfff8f0, 3.5);
      sun.position.set(6, 3, 4);
      scene.add(sun);
      // Subtle blue fill from opposite side
      const fill = new THREE.DirectionalLight(0x223366, 0.8);
      fill.position.set(-5, -2, -3);
      scene.add(fill);

      const loader = new THREE.TextureLoader();

      // NASA blue marble + topology bump + water specular from three-globe cdn
      const earthTex  = loader.load("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
      const bumpTex   = loader.load("https://unpkg.com/three-globe/example/img/earth-topology.png");
      const specTex   = loader.load("https://unpkg.com/three-globe/example/img/earth-water.png");
      const nightTex  = loader.load("https://unpkg.com/three-globe/example/img/earth-night.jpg");
      const cloudsTex = loader.load("https://unpkg.com/three-globe/example/img/clouds.png");

      // Earth
      const earthMat = new THREE.MeshPhongMaterial({
        map: earthTex,
        bumpMap: bumpTex,
        bumpScale: 0.04,
        specularMap: specTex,
        specular: new THREE.Color(0x4488bb),
        shininess: 20,
      });
      const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), earthMat);
      scene.add(earth);

      // Night lights layer (blended on dark side)
      const nightMat = new THREE.MeshPhongMaterial({
        map: nightTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      });
      const nightMesh = new THREE.Mesh(new THREE.SphereGeometry(1.001, 96, 96), nightMat);
      scene.add(nightMesh);

      // Clouds
      const cloudMat = new THREE.MeshPhongMaterial({
        map: cloudsTex,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), cloudMat);
      scene.add(clouds);

      // Atmosphere glow — outer halo
      const atmMat = new THREE.MeshPhongMaterial({
        color: 0x2266cc,
        transparent: true,
        opacity: 0.12,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.06, 48, 48), atmMat));

      // Inner atmosphere rim
      const rimMat = new THREE.MeshPhongMaterial({
        color: 0x55aaff,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 48, 48), rimMat));

      // Stars
      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(2000 * 3);
      for (let i = 0; i < 2000 * 3; i++) starPos[i] = (Math.random() - 0.5) * 100;
      starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
      scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.055, sizeAttenuation: true, transparent: true, opacity: 0.8 })));

      // ── Submarine cable network ──────────────────────────────────────
      // Convert lat/lon to 3D point on sphere surface (radius slightly above earth)
      function latLonToVec3(lat: number, lon: number, r = 1.018): THREE.Vector3 {
        const phi   = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return new THREE.Vector3(
          -r * Math.sin(phi) * Math.cos(theta),
           r * Math.cos(phi),
           r * Math.sin(phi) * Math.sin(theta)
        );
      }

      // Major submarine cable landing points (lat, lon, city)
      const cableNodes: [number, number, string][] = [
        [ -6.2,  106.8, "Jakarta"],
        [  1.3,  103.8, "Singapore"],
        [ 22.3,  114.2, "Hong Kong"],
        [ 35.7,  139.7, "Tokyo"],
        [ 37.6,  127.0, "Seoul"],
        [ 19.0,   72.8, "Mumbai"],
        [ 25.2,   55.3, "Dubai"],
        [-33.9,   18.4, "Cape Town"],
        [-23.5,  -46.6, "São Paulo"],
        [ 40.7,  -74.0, "New York"],
        [ 51.5,   -0.1, "London"],
        [ 48.8,    2.4, "Paris"],
        [ 22.5,   88.4, "Kolkata"],
        [  3.1,  101.7, "Kuala Lumpur"],
        [ 13.7,  100.5, "Bangkok"],
        [ 14.6,  121.0, "Manila"],
        [-33.9,  151.2, "Sydney"],
        [ 37.4, -122.1, "San Jose"],
        [ 25.8,  -80.1, "Miami"],
        [  4.4,    9.7, "Douala"],
        [ 30.0,   31.2, "Cairo"],
        [ 59.9,   10.7, "Oslo"],
        [-34.6,  -58.4, "Buenos Aires"],
        [  6.4,    3.4, "Lagos"],
      ];

      // Submarine cable routes (index pairs from cableNodes)
      const cableRoutes: [number, number][] = [
        [0,1],[0,2],[0,13],[0,14],[0,15],  // Jakarta hub
        [1,2],[1,3],[1,13],[1,14],[1,16],   // Singapore hub
        [2,3],[2,4],[2,15],                  // HK–Tokyo–Seoul
        [3,4],[3,16],                        // Japan–Sydney
        [1,6],[6,20],[6,10],                 // SEA–Middle East–Europe
        [5,6],[5,12],                        // India–Dubai–Kolkata
        [7,19],[7,23],[7,20],                // Africa
        [10,11],[10,21],[10,19],             // Europe
        [9,17],[9,10],[9,18],               // Atlantic
        [8,9],[8,18],[8,22],                 // South America
        [18,11],[18,23],                     // Caribbean–Europe–Africa
        [17,16],[17,1],                      // Trans-Pacific
        [16,15],[16,14],                     // Australia–SEA
      ];

      const cableGroup = new THREE.Group();

      // Draw cables as curved lines above globe surface
      cableRoutes.forEach(([ai, bi]) => {
        const a = latLonToVec3(cableNodes[ai][0], cableNodes[ai][1]);
        const b = latLonToVec3(cableNodes[bi][0], cableNodes[bi][1]);
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const lift = 1.0 + mid.length() * 0.08;
        mid.normalize().multiplyScalar(lift);

        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts   = curve.getPoints(60);
        const geo   = new THREE.BufferGeometry().setFromPoints(pts);
        const mat   = new THREE.LineBasicMaterial({
          color: 0x00e5cc,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        cableGroup.add(new THREE.Line(geo, mat));
      });

      // Landing point nodes — glowing dots
      const nodeGeo  = new THREE.SphereGeometry(0.012, 8, 8);
      const nodeMat  = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.95 });
      const haloGeo  = new THREE.SphereGeometry(0.022, 8, 8);
      const haloMat  = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.25, depthWrite: false });

      cableNodes.forEach(([lat, lon]) => {
        const pos = latLonToVec3(lat, lon);
        const dot  = new THREE.Mesh(nodeGeo, nodeMat);
        const halo = new THREE.Mesh(haloGeo, haloMat.clone());
        dot.position.copy(pos);
        halo.position.copy(pos);
        cableGroup.add(dot);
        cableGroup.add(halo);
      });

      scene.add(cableGroup);

      // ── Interaction state ────────────────────────────────────────────
      let rotX = 0.3, rotY = 0;
      let targetX = 0.3, targetY = 0;
      let isDragging = false;
      let prevX = 0, prevY = 0;
      let autoRotate = true;

      function animate() {
        animId = requestAnimationFrame(animate);
        if (autoRotate) targetY += 0.0012;
        rotX += (targetX - rotX) * 0.07;
        rotY += (targetY - rotY) * 0.07;

        earth.rotation.x = rotX;
        earth.rotation.y = rotY;
        nightMesh.rotation.x = rotX;
        nightMesh.rotation.y = rotY;
        clouds.rotation.x = rotX * 0.99;
        clouds.rotation.y = rotY + 0.0008;

        // Cable network rotates with earth
        cableGroup.rotation.x = rotX;
        cableGroup.rotation.y = rotY;

        // Pulse halo nodes
        const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
        cableGroup.children.forEach((child: any) => {
          if (child.material && child.material.opacity === 0.25 || (child.material && child.geometry && child.geometry.parameters?.radius === 0.022)) {
            child.material.opacity = 0.1 + pulse * 0.35;
            child.scale.setScalar(0.9 + pulse * 0.4);
          }
        });

        renderer.render(scene, camera);
      }
      animate();

      const container = containerRef.current!;
      container.style.cursor = "grab";

      const onMouseDown = (e: MouseEvent) => { isDragging = true; autoRotate = false; prevX = e.clientX; prevY = e.clientY; container.style.cursor = "grabbing"; };
      const onMouseUp   = () => { isDragging = false; container.style.cursor = "grab"; };
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        targetY += (e.clientX - prevX) * 0.007;
        targetX += (e.clientY - prevY) * 0.004;
        targetX = Math.max(-1.3, Math.min(1.3, targetX));
        prevX = e.clientX; prevY = e.clientY;
      };
      const onTouchStart = (e: TouchEvent) => { isDragging = true; autoRotate = false; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; };
      const onTouchEnd   = () => { isDragging = false; };
      const onTouchMove  = (e: TouchEvent) => {
        if (!isDragging) return;
        targetY += (e.touches[0].clientX - prevX) * 0.007;
        targetX += (e.touches[0].clientY - prevY) * 0.004;
        targetX = Math.max(-1.3, Math.min(1.3, targetX));
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
      };

      container.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("mousemove", onMouseMove);
      container.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchmove", onTouchMove, { passive: true });

      const handleResize = () => {
        if (!canvas) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      };
      window.addEventListener("resize", handleResize);
    };
    document.head.appendChild(script);

    return () => { cancelAnimationFrame(animId); };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block", pointerEvents: "none" }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setIsLoading(true);
    setError("");
    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const meRes = await apiAxios.get("/auth/me");
      const role_name = meRes.data?.user?.role_name;
      const roleRedirectMap: Record<string, string> = {
        admin: "/applications",
        hrd: "/approvals",
      };
      router.push(roleRedirectMap[role_name] || "/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && username && password) submit();
  };

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-950">
      {/* Sidebar Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gray-900 dark:bg-black flex-col justify-between p-12 border-r border-gray-800 dark:border-gray-900">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-14 h-14 rounded-xl bg-sidebar flex items-center justify-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-white text-xl font-semibold tracking-tight">KETROSDEN TRIASMITRA</h1>
              <p className="text-gray-400 text-xs">User Access Role</p>
            </div>
          </div>

          <div className="mt-16 space-y-6">
            <h2 className="text-white text-3xl font-bold leading-tight">
              Welcome to<br />Portal Ketrosden Triasmitra
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-sm leading-relaxed max-w-md">
              A centralized internal portal that provides Triasmitra employees with
              secure and seamless access to company systems, applications, and operational resources.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6">
            {[
              { icon: Layers, label: "Centralized System Access", desc: "One portal to access internal applications and platforms." },
              { icon: ShieldCheck, label: "Secure Authentication", desc: "Protected access aligned with company security policies." },
              { icon: Briefcase, label: "Operational Efficiency", desc: "Designed to support daily tasks and enterprise workflows." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex gap-4">
                <div className="w-8 h-8 bg-blue-600/20 text-blue-500 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-gray-500 text-xs mt-1">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-gray-500 dark:text-gray-600 text-xs">
          © {new Date().getFullYear()} PT Ketrosden Triasmitra. All rights reserved.
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden bg-[#020812]">
        <GlobeBackground />

        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(2,8,18,0.55) 100%)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600/80 backdrop-blur flex items-center justify-center rounded">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white text-xl font-semibold">Enterprise Portal</h1>
          </div>

          {/* Glassmorphism Login Card */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: "rgba(8, 16, 36, 0.52)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-sm text-blue-200/50">Enter your credentials to access your account</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 border-l-4 bg-red-900/40 border-red-500/60 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-blue-100/70">NIK</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/40" />
                  <Input
                    id="username"
                    placeholder="Enter NIK"
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-400/50"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-blue-100/70">Password</Label>
                  <a href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-400/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 border-white/20 rounded text-blue-500 focus:ring-blue-500 cursor-pointer bg-white/5"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-blue-100/50 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <Button
                onClick={submit}
                disabled={isLoading || !username || !password}
                className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-40"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : "Sign In"}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 text-white/25 uppercase tracking-wide" style={{ background: "transparent" }}>Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 justify-center transition-colors"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium">Sign in with Google SSO</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/30">
              Need help?{" "}
              <a
                href="https://wa.me/6289632167121"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}