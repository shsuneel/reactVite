import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ProductData {
  name: string; // e.g., "Current Product", "Past Products"
  value: number; // e.g., 4, 3
}

interface ChartExampleProps {
  data: ProductData[];
  title?: string;
}

const ChartExample: React.FC<ChartExampleProps> = ({
  data,
  title = 'Product Summary',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Initialize chart
      const chart = echarts.init(chartRef.current);

      // Configure options
      const option = {
        title: {
          text: title,
          left: 'center',
          textStyle: {
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: data.map(item => item.name),
          axisTick: {
            alignWithLabel: true,
          },
          axisLabel: {
            fontSize: 12,
          },
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 12,
          },
        },
        series: [
          {
            name: 'Number of Products',
            type: 'bar',
            barWidth: '60%',
            data: data.map(item => item.value),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#4F46E5' }, // indigo-600
                { offset: 1, color: '#818CF8' }, // indigo-400
              ]),
            },
            label: {
              show: true,
              position: 'top',
              fontWeight: 'bold',
            },
          },
        ],
      };

      // Set options
      chart.setOption(option);

      // Handle window resize
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [data, title]);

  return <div ref={chartRef} className="w-full h-80" />;
};

export default ChartExample;