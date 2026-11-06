// ClustersCard.tsx
import React from "react";
import { FaChevronRight, FaInfoCircle  } from "react-icons/fa";

interface ClusterItem {
  id: string;
  count: number;
  label?: string;
}

interface ClustersCardProps {
  // Text content
  title?: string;
  description?: string;
  submissionsLabel?: string;
  viewAllText?: string;
  
  // Data
  clusters?: ClusterItem[];
  
  // Colors
  cardBgColor?: string;
  titleColor?: string;
  descriptionColor?: string;
  submissionsLabelColor?: string;
  clusterBgColor?: string;
  clusterTextColor?: string;
  linkColor?: string;
  iconColor?: string;
  
  // Display options
  showInfoIcon?: boolean;
  showViewAll?: boolean;
  maxDisplayClusters?: number;
  
  // Callbacks
  onViewAllClick?: () => void;
  onClusterClick?: (cluster: ClusterItem) => void;
}

const ClustersCard: React.FC<ClustersCardProps> = ({
  title = "Clusters",
  description = "Aggregates submissions in groups, useful for exercises.",
  submissionsLabel = "Submissions",
  viewAllText = "View all clusters",
  clusters = [
    { id: "1", count: 0 },
    { id: "2", count: 0 },
  ],
  cardBgColor = "bg-white",
  titleColor = "text-gray-900",
  descriptionColor = "text-gray-500",
  submissionsLabelColor = "text-gray-700",
  clusterBgColor = "bg-orange-500",
  clusterTextColor = "text-white",
  linkColor = "text-blue-600",
  iconColor = "text-gray-400",
  showInfoIcon = true,
  showViewAll = true,
  maxDisplayClusters = 10,
  onViewAllClick,
  onClusterClick,
}) => {
  const displayClusters = clusters.slice(0, maxDisplayClusters);
  const hasMore = clusters.length > maxDisplayClusters;

  return (
    <div className={`${cardBgColor} rounded-lg shadow-sm border border-gray-200 p-6`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className={`text-xl font-semibold ${titleColor}`}>
            {title}
          </h2>
          {showInfoIcon && (
            <FaInfoCircle 
              className={`w-5 h-5 ${iconColor} cursor-pointer hover:text-gray-600 transition-colors`} 
              title="Information about clusters"
            />
          )}
        </div>
        <p className={`text-sm ${descriptionColor}`}>
          {description}
        </p>
      </div>

      {/* Submissions Label */}
      <div className={`text-sm font-semibold ${submissionsLabelColor} mb-3`}>
        {submissionsLabel}
      </div>

      {/* Clusters Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {displayClusters.map((cluster, index) => (
          <button
            key={cluster.id}
            onClick={() => onClusterClick?.(cluster)}
            className={`${clusterBgColor} ${clusterTextColor} w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm`}
            title={cluster.label || `Cluster ${index + 1}`}
          >
            {cluster.count}
          </button>
        ))}
        {hasMore && (
          <span className={`text-sm ${descriptionColor} self-center px-2`}>
            +{clusters.length - maxDisplayClusters} more
          </span>
        )}
      </div>

      {/* View All Link */}
      {showViewAll && (
        <button
          onClick={onViewAllClick}
          className={`flex items-center justify-center gap-1 text-sm font-medium ${linkColor} hover:opacity-80 transition-opacity w-full mt-2`}
        >
          {viewAllText}
          <FaChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ClustersCard;