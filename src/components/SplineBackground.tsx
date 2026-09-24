import { lazy, Suspense } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE = "https://prod.spline.design/Slk6b8kz3LRlKiyk/scene.splinecode";

const SplineBackground = () => (
  <div className="fixed inset-0 z-0">
    <Suspense fallback={<div className="absolute inset-0 bg-hero-bg" />}>
      <Spline scene={SPLINE_SCENE} className="w-full h-full" />
    </Suspense>
    <div className="absolute inset-0 bg-hero-bg/70" />
  </div>
);

export default SplineBackground;
