import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/brand_provider.dart';
import '../providers/trends_provider.dart';
import '../providers/copy_provider.dart';
import 'brand_screen.dart';
import 'trends_screen.dart';
import 'edit_post_screen.dart';
import 'publish_screen.dart';

class GeneratePostScreen extends StatefulWidget {
  @override
  State<GeneratePostScreen> createState() => _GeneratePostScreenState();
}

class _GeneratePostScreenState extends State<GeneratePostScreen> {
  String _selectedPlatform = 'twitter';
  bool _isGenerating = false;

  Future<void> _generatePost() async {
    final brandProvider = Provider.of<BrandProvider>(context, listen: false);
    final trendsProvider = Provider.of<TrendsProvider>(context, listen: false);
    final copyProvider = Provider.of<CopyProvider>(context, listen: false);

    if (brandProvider.selectedBrand == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a brand')),
      );
      return;
    }

    if (trendsProvider.selectedTrend == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a trend')),
      );
      return;
    }

    setState(() => _isGenerating = true);

    try {
      await copyProvider.generateCopy(
        brandId: brandProvider.selectedBrand!.id,
        trendId: trendsProvider.selectedTrend!.id,
        platform: _selectedPlatform,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✅ Post generated!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error: $e')),
      );
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Generate Post')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Step 1: Brand Selection
            Text('Step 1: Select Brand', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Consumer<BrandProvider>(
              builder: (context, brandProvider, _) {
                return GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => BrandScreen()),
                    );
                  },
                  child: Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey[50],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              brandProvider.selectedBrand?.brandName ?? 'No brand selected',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: brandProvider.selectedBrand != null ? Colors.black : Colors.grey,
                              ),
                            ),
                            if (brandProvider.selectedBrand != null)
                              Text(
                                brandProvider.selectedBrand!.industry,
                                style: TextStyle(color: Colors.grey[600], fontSize: 12),
                              ),
                          ],
                        ),
                        Icon(Icons.arrow_forward, color: Color(0xFF10B981)),
                      ],
                    ),
                  ),
                );
              },
            ),
            SizedBox(height: 32),

            // Step 2: Trend Selection
            Text('Step 2: Select Trend', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Consumer<TrendsProvider>(
              builder: (context, trendsProvider, _) {
                return GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrendsScreen()),
                    );
                  },
                  child: Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey[50],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                trendsProvider.selectedTrend?.title ?? 'No trend selected',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: trendsProvider.selectedTrend != null ? Colors.black : Colors.grey,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (trendsProvider.selectedTrend != null)
                                Padding(
                                  padding: EdgeInsets.only(top: 4),
                                  child: Text(
                                    '🔥 ${trendsProvider.selectedTrend!.score.toStringAsFixed(1)} • ${trendsProvider.selectedTrend!.source}',
                                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_forward, color: Color(0xFF10B981)),
                      ],
                    ),
                  ),
                );
              },
            ),
            SizedBox(height: 32),

            // Step 3: Platform Selection
            Text('Step 3: Select Platform', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: ['twitter', 'linkedin', 'facebook', 'instagram'].map((platform) {
                final isSelected = _selectedPlatform == platform;
                return FilterChip(
                  label: Text(platform.toUpperCase()),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedPlatform = platform),
                  backgroundColor: Colors.grey[200],
                  selectedColor: Color(0xFF10B981),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                    fontWeight: FontWeight.w500,
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: 32),

            // Generate button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _isGenerating ? null : _generatePost,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF10B981),
                ),
                child: _isGenerating
                    ? SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        '🚀 Generate Post',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),

            // Generated post preview
            Consumer<CopyProvider>(
              builder: (context, copyProvider, _) {
                if (copyProvider.currentPost == null) return SizedBox.shrink();

                return Padding(
                  padding: EdgeInsets.only(top: 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Generated Post', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      SizedBox(height: 12),
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: Color(0xFF10B981)),
                          borderRadius: BorderRadius.circular(8),
                          color: Color(0xFF10B981).withOpacity(0.05),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              copyProvider.currentPost!.copy,
                              style: TextStyle(fontSize: 14, height: 1.6),
                            ),
                            if (copyProvider.currentPost!.imageUrl != null)
                              Padding(
                                padding: EdgeInsets.only(top: 12),
                                child: Chip(label: Text('📸 Image attached')),
                              ),
                            SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 40,
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => EditPostScreen(
                                        postId: copyProvider.currentPost!.id,
                                        initialCopy: copyProvider.currentPost!.copy,
                                      ),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey[600],
                                ),
                                child: Text('✏️ Edit Post'),
                              ),
                            ),
                            SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => PublishScreen(
                                            postId: copyProvider.currentPost!.id,
                                          ),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Color(0xFF10B981),
                                    ),
                                    child: Text('📅 Schedule'),
                                  ),
                                ),
                                SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => PublishScreen(
                                            postId: copyProvider.currentPost!.id,
                                          ),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Color(0xFFF59E0B),
                                    ),
                                    child: Text('🚀 Publish'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
