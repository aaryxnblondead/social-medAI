import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/copy_provider.dart';
import 'image_generation_screen.dart';

class EditPostScreen extends StatefulWidget {
  final String postId;
  final String initialCopy;

  const EditPostScreen({
    required this.postId,
    required this.initialCopy,
  });

  @override
  State<EditPostScreen> createState() => _EditPostScreenState();
}

class _EditPostScreenState extends State<EditPostScreen> {
  late TextEditingController _copyController;
  bool _isEdited = false;

  @override
  void initState() {
    super.initState();
    _copyController = TextEditingController(text: widget.initialCopy);
    _copyController.addListener(() {
      setState(() {
        _isEdited = _copyController.text != widget.initialCopy;
      });
    });
  }

  @override
  void dispose() {
    _copyController.dispose();
    super.dispose();
  }

  Future<void> _saveCopy() async {
    final copyProvider = Provider.of<CopyProvider>(context, listen: false);
    try {
      await copyProvider.updateCopy(widget.postId, _copyController.text);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✅ Post updated')),
      );
      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Edit Post'),
        actions: [
          if (_isEdited)
            TextButton(
              onPressed: _saveCopy,
              child: Text('Save', style: TextStyle(color: Color(0xFF10B981))),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Word count
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Post Content',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_copyController.text.length}/280 chars',
                  style: TextStyle(
                    fontSize: 12,
                    color: _copyController.text.length > 280 ? Colors.red : Colors.grey,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),

            // Copy editor
            TextField(
              controller: _copyController,
              maxLines: 10,
              maxLength: 280,
              decoration: InputDecoration(
                hintText: 'Edit your post copy here...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding: EdgeInsets.all(12),
                counterText: '',
              ),
            ),
            SizedBox(height: 24),

            // Quick suggestions
            ExpansionTile(
              title: Text(
                'Quick Tips',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              children: [
                Padding(
                  padding: EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _TipItem('✓ Keep it under 280 characters'),
                      _TipItem('✓ Use relevant hashtags'),
                      _TipItem('✓ Add emojis for engagement'),
                      _TipItem('✓ Include a call-to-action'),
                      _TipItem('✓ Ask questions to encourage replies'),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),

            // Add image button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ImageGenerationScreen(
                        postId: widget.postId,
                        postCopy: _copyController.text,
                      ),
                    ),
                  );
                },
                icon: Icon(Icons.image),
                label: Text('Add Image'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Color(0xFF10B981),
                  side: BorderSide(color: Color(0xFF10B981), width: 2),
                ),
              ),
            ),
            SizedBox(height: 16),

            // Actions
            if (_isEdited)
              Consumer<CopyProvider>(
                builder: (context, copyProvider, _) {
                  return SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: copyProvider.isLoading ? null : _saveCopy,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF10B981),
                      ),
                      child: copyProvider.isLoading
                          ? SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              '💾 Save Changes',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
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

class _TipItem extends StatelessWidget {
  final String text;

  const _TipItem(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 6),
      child: Text(text, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
    );
  }
}
