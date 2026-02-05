/**
 * Cost Estimation & Optimization Service
 * Calculates cloud costs and provides optimization recommendations
 */

import type {
  CloudResource,
  CostEstimate,
  CostBreakdown,
  CostRecommendation,
  SustainabilityMetrics,
} from '../store/integrationTypes';

// ============================================================================
// Pricing Data (Simplified - real version would use AWS/GCP/Azure Pricing APIs)
// ============================================================================

const AWS_PRICING = {
  compute: {
    't2.micro': 0.0116, // per hour
    't2.small': 0.023,
    't2.medium': 0.0464,
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    'm5.large': 0.096,
    'm5.xlarge': 0.192,
    'c5.large': 0.085,
    'c5.xlarge': 0.17,
  },
  storage: {
    's3': 0.023, // per GB/month
    'ebs-gp3': 0.08, // per GB/month
    'ebs-io1': 0.125,
  },
  database: {
    'rds-t3.micro': 0.017, // per hour
    'rds-t3.small': 0.034,
    'rds-m5.large': 0.17,
    'aurora-serverless': 0.06, // per ACU-hour
    'dynamodb': 0.25, // per million write requests
  },
  networking: {
    'data-transfer-out': 0.09, // per GB
    'data-transfer-in': 0, // Free
    'cross-az': 0.01, // per GB
    'nat-gateway': 0.045, // per hour
  },
  lambda: {
    'invocation': 0.20, // per 1M requests
    'duration': 0.0000166667, // per GB-second
  },
};

const GCP_PRICING = {
  compute: {
    'e2-micro': 0.0084,
    'e2-small': 0.0168,
    'e2-medium': 0.0336,
    'n1-standard-1': 0.0475,
    'n1-standard-2': 0.095,
  },
  storage: {
    'standard': 0.020, // per GB/month
    'nearline': 0.010,
    'coldline': 0.004,
  },
};

const AZURE_PRICING = {
  compute: {
    'B1s': 0.0104,
    'B1ms': 0.0207,
    'B2s': 0.0416,
    'D2s_v3': 0.096,
  },
  storage: {
    'hot': 0.0184, // per GB/month
    'cool': 0.01,
    'archive': 0.00099,
  },
};

// ============================================================================
// Cost Estimation Engine
// ============================================================================

export class CostEstimator {
  /**
   * Calculate monthly cost for a cloud resource
   */
  static estimateCost(resource: CloudResource): CostEstimate {
    const breakdown: CostBreakdown[] = [];
    let totalCost = 0;

    // Compute cost
    const computeCost = this.calculateComputeCost(resource);
    if (computeCost > 0) {
      breakdown.push({
        category: 'compute',
        monthlyCost: computeCost,
        details: `${resource.instanceType} × ${resource.instanceCount || 1} instance(s)`,
      });
      totalCost += computeCost;
    }

    // Storage cost
    const storageCost = this.calculateStorageCost(resource);
    if (storageCost > 0) {
      breakdown.push({
        category: 'storage',
        monthlyCost: storageCost,
        details: `${resource.storage?.sizeGB || 0} GB ${resource.storage?.type || 'standard'}`,
      });
      totalCost += storageCost;
    }

    // Networking cost
    const networkingCost = this.calculateNetworkingCost(resource);
    if (networkingCost > 0) {
      breakdown.push({
        category: 'networking',
        monthlyCost: networkingCost,
        details: `${resource.networking?.bandwidth || 0} GB/month data transfer`,
      });
      totalCost += networkingCost;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(resource, totalCost);

    return {
      nodeId: resource.nodeId,
      monthlyCost: totalCost,
      breakdown,
      recommendations,
    };
  }

  private static calculateComputeCost(resource: CloudResource): number {
    if (!resource.instanceType) return 0;

    const hoursPerMonth = 730; // Average
    const instanceCount = resource.instanceCount || 1;

    let hourlyRate = 0;

    switch (resource.provider) {
      case 'aws':
        hourlyRate = AWS_PRICING.compute[resource.instanceType] || 0.05;
        break;
      case 'gcp':
        hourlyRate = GCP_PRICING.compute[resource.instanceType] || 0.05;
        break;
      case 'azure':
        hourlyRate = AZURE_PRICING.compute[resource.instanceType] || 0.05;
        break;
    }

    return hourlyRate * hoursPerMonth * instanceCount;
  }

  private static calculateStorageCost(resource: CloudResource): number {
    if (!resource.storage?.sizeGB) return 0;

    let pricePerGB = 0;

    switch (resource.provider) {
      case 'aws':
        pricePerGB = AWS_PRICING.storage[resource.storage.type] || 0.023;
        break;
      case 'gcp':
        pricePerGB = GCP_PRICING.storage[resource.storage.type] || 0.020;
        break;
      case 'azure':
        pricePerGB = AZURE_PRICING.storage[resource.storage.type] || 0.0184;
        break;
    }

    return pricePerGB * resource.storage.sizeGB;
  }

  private static calculateNetworkingCost(resource: CloudResource): number {
    if (!resource.networking?.bandwidth) return 0;

    const bandwidth = resource.networking.bandwidth;
    const crossAZ = resource.networking.crossAZ || false;
    const crossRegion = resource.networking.crossRegion || false;

    let cost = bandwidth * AWS_PRICING.networking['data-transfer-out'];

    if (crossAZ) {
      cost += bandwidth * AWS_PRICING.networking['cross-az'];
    }

    if (crossRegion) {
      cost += bandwidth * 0.02; // Higher cost for cross-region
    }

    return cost;
  }

  private static generateRecommendations(
    resource: CloudResource,
    currentCost: number
  ): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Recommendation 1: Right-sizing (if over-provisioned)
    if (resource.provider === 'aws' && resource.instanceType?.includes('large')) {
      const smallerInstance = resource.instanceType.replace('large', 'medium');
      const projectedCost = currentCost * 0.5; // Assume 50% savings

      recommendations.push({
        type: 'right-size',
        currentCost,
        projectedCost,
        savings: currentCost - projectedCost,
        savingsPercentage: 50,
        description: `Consider downsizing to ${smallerInstance}`,
        implementation: `Update instance type in your infrastructure configuration`,
      });
    }

    // Recommendation 2: Reserved Instances (for steady workloads)
    if (resource.instanceCount && resource.instanceCount >= 1) {
      const projectedCost = currentCost * 0.67; // 33% savings with 1-year reserved

      recommendations.push({
        type: 'reserved-instance',
        currentCost,
        projectedCost,
        savings: currentCost - projectedCost,
        savingsPercentage: 33,
        description: 'Purchase 1-year Reserved Instances for steady workloads',
        implementation: 'Convert on-demand instances to reserved instances in AWS console',
      });
    }

    // Recommendation 3: Serverless alternative (for low/variable traffic)
    if (resource.resourceType === 'EC2' || resource.resourceType === 'compute') {
      const projectedCost = currentCost * 0.4; // Assume 60% savings

      recommendations.push({
        type: 'serverless',
        currentCost,
        projectedCost,
        savings: currentCost - projectedCost,
        savingsPercentage: 60,
        description: 'Migrate to AWS Lambda or similar serverless platform',
        implementation: 'Refactor application to run on Lambda/Cloud Functions',
      });
    }

    // Recommendation 4: Storage tier optimization
    if (resource.storage && resource.storage.sizeGB > 100) {
      const projectedCost = currentCost * 0.85; // 15% savings

      recommendations.push({
        type: 'storage-tier',
        currentCost,
        projectedCost,
        savings: currentCost - projectedCost,
        savingsPercentage: 15,
        description: 'Use S3 Intelligent-Tiering for automatic cost optimization',
        implementation: 'Enable Intelligent-Tiering in S3 bucket configuration',
      });
    }

    return recommendations;
  }

  /**
   * Calculate total cost across all resources
   */
  static calculateTotalCost(resources: Record<string, CloudResource>): {
    total: number;
    byCategory: Record<string, number>;
    byProvider: Record<string, number>;
  } {
    const estimates = Object.values(resources).map((r) => this.estimateCost(r));

    const total = estimates.reduce((sum, e) => sum + e.monthlyCost, 0);

    const byCategory: Record<string, number> = {};
    const byProvider: Record<string, number> = {};

    for (const resource of Object.values(resources)) {
      const estimate = this.estimateCost(resource);

      for (const item of estimate.breakdown) {
        byCategory[item.category] = (byCategory[item.category] || 0) + item.monthlyCost;
      }

      byProvider[resource.provider] =
        (byProvider[resource.provider] || 0) + estimate.monthlyCost;
    }

    return { total, byCategory, byProvider };
  }
}

// ============================================================================
// Sustainability Metrics Calculator
// ============================================================================

export class SustainabilityCalculator {
  // Carbon intensity by AWS region (gCO2/kWh)
  private static readonly CARBON_INTENSITY = {
    'us-east-1': 415, // Virginia
    'us-west-2': 285, // Oregon (hydro)
    'eu-west-1': 295, // Ireland (wind)
    'eu-central-1': 338, // Frankfurt
    'ap-southeast-1': 527, // Singapore
    'ap-northeast-1': 462, // Tokyo
  };

  // Average power consumption by instance type (kW)
  private static readonly POWER_CONSUMPTION = {
    't2.micro': 0.01,
    't2.small': 0.015,
    't2.medium': 0.025,
    't3.micro': 0.008,
    't3.small': 0.012,
    't3.medium': 0.02,
    'm5.large': 0.05,
    'm5.xlarge': 0.1,
  };

  /**
   * Calculate sustainability metrics for a resource
   */
  static calculate(resource: CloudResource): SustainabilityMetrics {
    const powerConsumption = this.getPowerConsumption(resource);
    const carbonIntensity = this.CARBON_INTENSITY[resource.region] || 400;

    // kWh per month
    const hoursPerMonth = 730;
    const kWhPerMonth = powerConsumption * hoursPerMonth * (resource.instanceCount || 1);

    // Carbon footprint (kg CO2)
    const carbonFootprint = (kWhPerMonth * carbonIntensity) / 1000;

    const recommendations = this.generateGreenRecommendations(resource, carbonFootprint);

    return {
      nodeId: resource.nodeId,
      carbonFootprint,
      powerConsumption: kWhPerMonth,
      region: resource.region,
      recommendations,
    };
  }

  private static getPowerConsumption(resource: CloudResource): number {
    if (!resource.instanceType) return 0.03; // Default

    return this.POWER_CONSUMPTION[resource.instanceType] || 0.03;
  }

  private static generateGreenRecommendations(
    resource: CloudResource,
    currentFootprint: number
  ): string[] {
    const recommendations: string[] = [];

    // Recommend greener regions
    const currentIntensity = this.CARBON_INTENSITY[resource.region] || 400;
    const greenRegions = Object.entries(this.CARBON_INTENSITY)
      .filter(([_, intensity]) => intensity < currentIntensity)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 3);

    if (greenRegions.length > 0) {
      const [bestRegion, bestIntensity] = greenRegions[0];
      const savings = ((currentIntensity - bestIntensity) / currentIntensity) * 100;
      recommendations.push(
        `Migrate to ${bestRegion} for ${savings.toFixed(0)}% lower carbon footprint`
      );
    }

    // Recommend renewable energy credits
    if (currentFootprint > 100) {
      recommendations.push('Consider purchasing renewable energy credits (RECs)');
    }

    // Recommend efficiency improvements
    if (resource.instanceType?.includes('large')) {
      recommendations.push('Right-size instances to reduce power consumption');
    }

    // Recommend serverless for intermittent workloads
    recommendations.push('Use serverless functions for variable workloads to reduce idle power');

    return recommendations;
  }
}

// ============================================================================
// Waste Detection
// ============================================================================

export class WasteDetector {
  /**
   * Identify over-provisioned or idle resources
   */
  static detectWaste(resource: CloudResource, metrics?: {
    avgCPU: number;
    avgMemory: number;
    requestRate: number;
  }): {
    hasWaste: boolean;
    wastePercentage: number;
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let wastePercentage = 0;

    if (!metrics) {
      return { hasWaste: false, wastePercentage: 0, reasons, recommendations };
    }

    // Check CPU utilization
    if (metrics.avgCPU < 20) {
      reasons.push(`Low CPU utilization: ${metrics.avgCPU.toFixed(1)}%`);
      wastePercentage += 30;
      recommendations.push('Consider downsizing instance or using auto-scaling');
    }

    // Check memory utilization
    if (metrics.avgMemory < 30) {
      reasons.push(`Low memory utilization: ${metrics.avgMemory.toFixed(1)}%`);
      wastePercentage += 20;
      recommendations.push('Right-size memory allocation');
    }

    // Check request rate
    if (metrics.requestRate < 10) {
      reasons.push(`Low request rate: ${metrics.requestRate.toFixed(1)} RPS`);
      wastePercentage += 25;
      recommendations.push('Consider consolidating with other services or using serverless');
    }

    // Idle resource
    if (metrics.avgCPU < 5 && metrics.requestRate < 1) {
      reasons.push('Resource appears to be idle');
      wastePercentage = 90;
      recommendations.push('Consider shutting down or scheduling based on usage patterns');
    }

    return {
      hasWaste: wastePercentage > 20,
      wastePercentage: Math.min(wastePercentage, 100),
      reasons,
      recommendations,
    };
  }
}

// ============================================================================
// Cost Trend Analysis
// ============================================================================

export interface CostHistory {
  timestamp: number;
  cost: number;
  resources: number;
}

export class CostTrendAnalyzer {
  /**
   * Analyze cost trends over time
   */
  static analyzeTrend(history: CostHistory[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    percentageChange: number;
    projectedNextMonth: number;
    alerts: string[];
  } {
    if (history.length < 2) {
      return {
        trend: 'stable',
        percentageChange: 0,
        projectedNextMonth: history[0]?.cost || 0,
        alerts: [],
      };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const change = ((latest.cost - previous.cost) / previous.cost) * 100;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (change > 5) trend = 'increasing';
    else if (change < -5) trend = 'decreasing';

    // Project next month using linear regression
    const projectedNextMonth = this.linearProjection(history);

    const alerts: string[] = [];
    if (change > 20) {
      alerts.push(`Cost increased by ${change.toFixed(1)}% - investigate immediately`);
    }
    if (projectedNextMonth > latest.cost * 1.5) {
      alerts.push('Projected cost for next month is 50% higher than current');
    }

    return {
      trend,
      percentageChange: change,
      projectedNextMonth,
      alerts,
    };
  }

  private static linearProjection(history: CostHistory[]): number {
    if (history.length < 2) return history[0]?.cost || 0;

    const n = history.length;
    const sumX = history.reduce((sum, _, i) => sum + i, 0);
    const sumY = history.reduce((sum, h) => sum + h.cost, 0);
    const sumXY = history.reduce((sum, h, i) => sum + i * h.cost, 0);
    const sumX2 = history.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return slope * n + intercept;
  }
}
