/**
 * Logo 3D suave hecho de discos (impostores de esfera) que viajan hasta formar un QR plano.
 * Cada partícula es un quad que mira a cámara: en el logo es un disco con profundidad
 * esférica que se funde con sus vecinas; en el QR se vuelve el cuadrado de su celda.
 *
 * La idea de morph "objeto 3D -> QR escaneable" y el redondeado de módulos por vecinos
 * están inspirados en Every QR Code (https://github.com/AlbertAZ1992/every-qrcode, MIT).
 */
export const LOGO_QR_SHADER = /* wgsl */ `
struct Uniforms {
  aspect: f32,
  time: f32,
  progress: f32,
  gridSize: f32,
  intro: f32,
  zoom: f32,
  sub: f32,
  yaw: f32,
  pitch: f32,
  tiles: f32,
  pad1: f32,
  pad2: f32,
  paper: vec4f,
  ink: vec4f,
  logo: vec4f,
  logoLight: vec4f,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<vec4f>;

struct VOut {
  @builtin(position) position: vec4f,
  @location(0) p: vec2f,
  @location(1) @interpolate(flat) blend: f32,
  @location(2) @interpolate(flat) lit: vec3f,
  @location(3) @interpolate(flat) mask: u32,
  @location(4) @interpolate(flat) sub: vec2f,
  @location(5) @interpolate(flat) nearness: f32,
  @location(6) @interpolate(flat) radius: f32,
}

struct FOut {
  @location(0) color: vec4f,
  @builtin(frag_depth) depth: f32,
}

fn hash21(p: vec2f) -> f32 {
  let s = fract(p * vec2f(0.1031, 0.103));
  let f = s + dot(s, s.yx + 19.19);
  return fract((f.x + f.y) * f.x);
}

fn smootherstep01(x: f32) -> f32 {
  let t = clamp(x, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

fn rotateView(v: vec3f) -> vec3f {
  let cy = cos(u.yaw);
  let sy = sin(u.yaw);
  let x1 = v.x * cy + v.z * sy;
  let z1 = -v.x * sy + v.z * cy;
  let cp = cos(u.pitch);
  let sp = sin(u.pitch);
  return vec3f(x1, v.y * cp - z1 * sp, v.y * sp + z1 * cp);
}

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VOut {
  var out: VOut;
  var quad = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0),
  );
  let corner = quad[vertexIndex] * 2.0 - vec2f(1.0);

  let base = instanceIndex * 3u;
  let a = particles[base];
  let b = particles[base + 1u];
  let c = particles[base + 2u];

  let cell = 1.0 / u.gridSize;
  let unit = cell / u.tiles;
  let thin = cell * 0.14;
  let seed = f32(instanceIndex);
  let r1 = hash21(vec2f(seed, 3.7));
  let r2 = hash21(vec2f(seed, 9.1));
  let r3 = hash21(vec2f(seed, 1.3));

  let spread = 0.5;
  let travel = smootherstep01(u.progress * (1.0 + spread) - a.w * spread);
  let blend = smoothstep(0.45, 0.92, travel);

  let introRaw = clamp(u.intro * 1.5 - r1 * 0.5, 0.0, 1.0);
  let introEase = 1.0 - pow(1.0 - introRaw, 3.0);
  let scatter = vec3f(r1 - 0.5, r2 - 0.5 + 0.35, r3 - 0.5) * vec3f(1.8, 1.4, 1.4);

  let logoPos = mix(scatter, a.xyz * unit, introEase);
  let qrPos = vec3f(b.x * cell, thin * 0.5, b.y * cell);
  let hop = sin(travel * 3.14159265) * (0.05 + 0.14 * r2);
  let center = mix(logoPos, qrPos, travel) + vec3f(0.0, hop, 0.0);

  var visible = introEase;
  if (c.w < 0.5) { visible = visible * (1.0 - smoothstep(0.7, 1.0, travel)); }
  let radius = unit * mix(1.6, 0.515, blend) * visible;

  let view = rotateView(center);
  let sx = u.zoom / max(u.aspect, 1.0);
  let sy = u.zoom / max(1.0 / u.aspect, 1.0);
  let clip = vec2f((view.x + corner.x * radius) * sx, (view.y + corner.y * radius) * sy);
  out.position = vec4f(clip, 0.5 - view.z * 0.45, 1.0);
  out.p = corner;

  let n = normalize(rotateView(c.xyz));
  let lightDir = normalize(vec3f(-0.5, 0.6, 0.62));
  let glow = pow(max(dot(n, lightDir), 0.0), 4.0);
  out.lit = mix(u.logo.rgb, u.logoLight.rgb, glow);

  out.blend = blend;
  out.mask = u32(b.z);
  let subCode = u32(b.w);
  out.sub = vec2f(
    f32(subCode & 15u) + f32((subCode >> 8u) & 3u) / u.tiles,
    f32((subCode >> 4u) & 15u) + f32((subCode >> 10u) & 3u) / u.tiles,
  );
  out.nearness = view.z;
  out.radius = radius;
  return out;
}

fn qrRoundedMask(moduleUv: vec2f, mask: u32) -> f32 {
  let up = (mask & 1u) != 0u;
  let right = (mask & 2u) != 0u;
  let down = (mask & 4u) != 0u;
  let left = (mask & 8u) != 0u;
  let r = 0.42;
  var m = 1.0;
  if (!left && !up && moduleUv.x < r && moduleUv.y < r) {
    m = m * (1.0 - step(r, distance(moduleUv, vec2f(r))));
  }
  if (!right && !up && moduleUv.x > 1.0 - r && moduleUv.y < r) {
    m = m * (1.0 - step(r, distance(moduleUv, vec2f(1.0 - r, r))));
  }
  if (!left && !down && moduleUv.x < r && moduleUv.y > 1.0 - r) {
    m = m * (1.0 - step(r, distance(moduleUv, vec2f(r, 1.0 - r))));
  }
  if (!right && !down && moduleUv.x > 1.0 - r && moduleUv.y > 1.0 - r) {
    m = m * (1.0 - step(r, distance(moduleUv, vec2f(1.0 - r))));
  }
  return m;
}

@fragment
fn fragmentMain(in: VOut) -> FOut {
  var out: FOut;
  let radial = dot(in.p, in.p);
  let distCircle = sqrt(radial);
  let distSquare = max(abs(in.p.x), abs(in.p.y));
  let dist = mix(distCircle, distSquare, in.blend);
  let edge = fwidth(dist);
  var alpha = 1.0 - smoothstep(1.0 - edge, 1.0, dist);
  alpha = mix(alpha, 1.0, smoothstep(0.8, 1.0, in.blend));

  let tileUv = vec2f(in.p.x * 0.5 + 0.5, 0.5 - in.p.y * 0.5) / u.tiles;
  let moduleUv = (in.sub + tileUv) / u.sub;
  let qrColor = mix(u.paper.rgb, u.ink.rgb, qrRoundedMask(moduleUv, in.mask));
  let color = mix(in.lit, qrColor, in.blend);

  let bulge = sqrt(max(1.0 - radial, 0.0)) * in.radius * 0.35 * (1.0 - in.blend);
  out.color = vec4f(clamp(color, vec3f(0.0), vec3f(1.0)), alpha);
  out.depth = clamp(0.5 - (in.nearness + bulge) * 0.45, 0.0, 1.0);
  return out;
}
`
