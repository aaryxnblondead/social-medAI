import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/trends_provider.dart';

class TrendsScreen extends StatefulWidget {
  @override
  State<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends State<TrendsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TrendsProvider>(context, listen: false).fetchTrends();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Select Trend'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              Provider.of<TrendsProvider>(context, listen: false).refreshTrends();
            },
          ),
        ],
      ),
      body: Consumer<TrendsProvider>(
        builder: (context, trendsProvider, _) {
          return Column(
            children: [
              // Source filter
              Container(
                padding: EdgeInsets.all(16),
                color: Colors.white,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _SourceButton('All', 'all', trendsProvider),
                    _SourceButton('Twitter', 'twitter', trendsProvider),
                    _SourceButton('News', 'newsapi', trendsProvider),
                  ],
                ),
              ),

              // Trends list
              Expanded(
                child: trendsProvider.isLoading
                    ? Center(child: CircularProgressIndicator())
                    : trendsProvider.trends.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.trending_up, size: 64, color: Colors.grey),
                                SizedBox(height: 16),
                                Text('No trends available', style: TextStyle(fontSize: 16)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: EdgeInsets.all(16),
                            itemCount: trendsProvider.trends.length,
                            itemBuilder: (context, index) {
                              final trend = trendsProvider.trends[index];
                              final isSelected = trendsProvider.selectedTrend?.id == trend.id;

                              return Card(
                                color: isSelected ? Color(0xFF10B981) : Colors.white,
                                margin: EdgeInsets.only(bottom: 12),
                                child: ListTile(
                                  title: Text(
                                    trend.title,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.white : Colors.black,
                                    ),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      SizedBox(height: 4),
                                      Text(
                                        trend.description,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: isSelected ? Colors.white70 : Colors.grey,
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(Icons.local_fire_department,
                                              size: 16,
                                              color: isSelected ? Colors.white : Color(0xFFF59E0B)),
                                          SizedBox(width: 4),
                                          Text(
                                            'Score: ${trend.score.toStringAsFixed(1)}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: isSelected ? Colors.white70 : Colors.grey,
                                            ),
                                          ),
                                          SizedBox(width: 16),
                                          Chip(
                                            label: Text(
                                              trend.source,
                                              style: TextStyle(fontSize: 11),
                                            ),
                                            backgroundColor: isSelected
                                                ? Colors.white24
                                                : Color(0xFFE5E7EB),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  onTap: () {
                                    trendsProvider.selectTrend(trend);
                                    Navigator.pop(context);
                                  },
                                  trailing: isSelected
                                      ? Icon(Icons.check_circle, color: Colors.white)
                                      : null,
                                ),
                              );
                            },
                          ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SourceButton extends StatelessWidget {
  final String label;
  final String source;
  final TrendsProvider provider;

  const _SourceButton(this.label, this.source, this.provider);

  @override
  Widget build(BuildContext context) {
    final isActive = provider.selectedSource == source;
    return ElevatedButton(
      onPressed: () => provider.fetchTrends(source: source),
      style: ElevatedButton.styleFrom(
        backgroundColor: isActive ? Color(0xFF10B981) : Colors.grey[300],
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.black,
        ),
      ),
    );
  }
}
