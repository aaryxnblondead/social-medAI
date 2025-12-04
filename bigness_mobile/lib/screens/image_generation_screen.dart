import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/image_provider.dart';
import '../providers/copy_provider.dart';

class ImageGenerationScreen extends StatefulWidget {
  final String postId;
  final String postCopy;

  const ImageGenerationScreen({
    required this.postId,
    required this.postCopy,
  });

  @override
  State<ImageGenerationScreen> createState() => _ImageGenerationScreenState();
}

class _ImageGenerationScreenState extends State<ImageGenerationScreen> {
  final _promptController = TextEditingController();
  String _selectedStyle = 'professional';

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  void _generateImage() async {
    if (_promptController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter an image description')),
      );
      return;
    }

    await Provider.of<ImageProvider>(context, listen: false).generateImage(
      postId: widget.postId,
      prompt: _promptController.text,
      style: _selectedStyle,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Generate Image')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Post preview
            Text(
              'Post Content',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                widget.postCopy,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 13, height: 1.5),
              ),
            ),
            SizedBox(height: 32),

            // Image prompt input
            Text(
              'Image Description',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            TextField(
              controller: _promptController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText:
                    'Describe the image you want to generate (e.g., "A modern tech workspace with laptops and coffee")',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: EdgeInsets.all(12),
              ),
            ),
            SizedBox(height: 24),

            // Style selection
            Text(
              'Image Style',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: [
                'professional',
                'creative',
                'minimal',
                'bold',
                'casual',
              ].map((style) {
                final isSelected = _selectedStyle == style;
                return FilterChip(
                  label: Text(style.toUpperCase()),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedStyle = style),
                  backgroundColor: Colors.grey[200],
                  selectedColor: Color(0xFF10B981),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: 32),

            // Generate button with progress
            Consumer<ImageProvider>(
              builder: (context, imageProvider, _) {
                return Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: imageProvider.isGenerating ? null : _generateImage,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF10B981),
                        ),
                        child: imageProvider.isGenerating
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor:
                                          AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Text(
                                    'Generating Image...',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              )
                            : Text(
                                '🎨 Generate Image',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    if (imageProvider.isGenerating)
                      Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Column(
                          children: [
                            LinearProgressIndicator(
                              value: imageProvider.generationProgress,
                              minHeight: 4,
                              backgroundColor: Colors.grey[300],
                              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                            ),
                            SizedBox(height: 8),
                            Text(
                              '${(imageProvider.generationProgress * 100).toStringAsFixed(0)}%',
                              style: TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                  ],
                );
              },
            ),
            SizedBox(height: 32),

            // Generated image preview
            Consumer<ImageProvider>(
              builder: (context, imageProvider, _) {
                if (imageProvider.generatedImageUrl == null) {
                  return SizedBox.shrink();
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Generated Image',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      height: 300,
                      decoration: BoxDecoration(
                        border: Border.all(color: Color(0xFF10B981), width: 2),
                        borderRadius: BorderRadius.circular(8),
                        color: Colors.grey[100],
                      ),
                      child: Stack(
                        children: [
                          Image.network(
                            imageProvider.generatedImageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.image, size: 48, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text('Image preview unavailable'),
                                ],
                              );
                            },
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: IconButton(
                              icon: Icon(Icons.close, color: Colors.white),
                              style: IconButton.styleFrom(
                                backgroundColor: Colors.black54,
                              ),
                              onPressed: () {
                                imageProvider.clearImage();
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Image attached to post')),
                              );
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF10B981),
                            ),
                            child: Text('✓ Use This Image'),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _generateImage,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey[600],
                            ),
                            child: Text('🔄 Regenerate'),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
