/**
 * Synth Studio Documentation Component Kit
 *
 * Production-grade MDX components for enterprise documentation.
 *
 * @example
 * ```mdx
 * import { IconFeature, FeatureGrid, Param, Badge, BadgeGroup } from '@site/src/components';
 *
 * <FeatureGrid>
 *   <IconFeature icon="ShieldCheck" title="Privacy First">
 *     Mathematical privacy guarantees with differential privacy.
 *   </IconFeature>
 * </FeatureGrid>
 *
 * Set <Param name="epsilon" type="float" /> to configure privacy budget.
 *
 * <BadgeGroup>
 *   <Badge type="HIPAA" />
 *   <Badge type="GDPR" />
 * </BadgeGroup>
 * ```
 */

// Feature components
export { IconFeature, FeatureGrid } from "./IconFeature";

// Parameter display
export { Param } from "./Param";

// Compliance badges
export { Badge, BadgeGroup } from "./Badge";
