import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/copy_provider.dart';
import 'image_generation_screen.dart';

class EditPostScreen extends StatefulWidget {
  final String postId;
  final String initialCopy;

  const EditPostScreen({
    super.key,
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
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('✅ Post updated')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Post'),
        actions: [
          if (_isEdited)
            TextButton(
              onPressed: _saveCopy,
              child: const Text('Save', style: TextStyle(color: Color(0xFF10B981))),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Word count
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
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
            const SizedBox(height: 12),

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
                contentPadding: const EdgeInsets.all(12),
                counterText: '',
              ),
            ),
            const SizedBox(height: 24),

            // Quick suggestions
            ExpansionTile(
              title: Text(
                'Quick Tips',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _TipItem('✓ Keep it under 280 characters'),
                      const _TipItem('✓ Use relevant hashtags'),
                      const _TipItem('✓ Add emojis for engagement'),
                      const _TipItem('✓ Include a call-to-action'),
                      const _TipItem('✓ Ask questions to encourage replies'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

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
                icon: const Icon(Icons.image),
                label: const Text('Add Image'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF10B981),
                  side: const BorderSide(color: Color(0xFF10B981), width: 2),
                ),
              ),
            ),
            const SizedBox(height: 16),

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
                        backgroundColor: const Color(0xFF10B981),
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
                          : const Text(
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

  const _TipItem(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text(text, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
    );
  }
}
