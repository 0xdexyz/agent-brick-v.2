import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders fixed-position modal content into document.body via a portal.
 * Without this, a modal nested under an ancestor with backdrop-filter/filter/transform
 * (e.g. the navbar's backdrop-blur) has its `fixed inset-0` computed relative to that
 * ancestor's box instead of the viewport, per the CSS containing-block spec.
 */
const ModalPortal = ({ children }: { children: ReactNode }) => createPortal(children, document.body);

export default ModalPortal;
