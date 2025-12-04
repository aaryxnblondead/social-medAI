import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/copy_provider.dart';
import '../providers/publishing_provider.dart';

class PublishScreen extends StatefulWidget {
  final String postId;

  const PublishScreen({required this.postId});

  @override
  State<PublishScreen> createState() => _PublishScreenState();
}

class _PublishScreenState extends State<PublishScreen> {
  final Set<String> _selectedPlatforms = {'twitter'};
  DateTime? _scheduledTime;
  bool _isScheduled = false;

  void _selectDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: now.add(Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(Duration(days: 365)),
    );

    if (date != null) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay(hour: 9, minute: 0),
      );

      if (time != null) {
        setState(() {
          _scheduledTime = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _publish() async {
    final publishingProvider = Provider.of<PublishingProvider>(context, listen: false);

    if (_selectedPlatforms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select at least one platform')),
      );
      return;
    }

    if (_isScheduled && _scheduledTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a scheduled time')),
      );
      return;
    }

    try {
      if (_isScheduled) {
        await publishingProvider.schedulePost(
          widget.postId,
          _scheduledTime!,
          _selectedPlatforms.toList(),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Post scheduled for ${DateFormat('MMM dd, yyyy hh:mm a').format(_scheduledTime!)}')),
        );
      } else {
        await publishingProvider.publishMultiPlatform(
          widget.postId,
          _selectedPlatforms.toList(),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Post published to ${_selectedPlatforms.join(", ").toUpperCase()}')),
        );
      }

      Future.delayed(Duration(seconds: 1), () {
        Navigator.pop(context);
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Publish Post')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Platform selection
            Text(
              'Select Platforms',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: ['twitter', 'linkedin', 'facebook', 'instagram'].map((platform) {
                  final isSelected = _selectedPlatforms.contains(platform);
                  return CheckboxListTile(
                    value: isSelected,
                    onChanged: (value) {
                      setState(() {
                        if (value == true) {
                          _selectedPlatforms.add(platform);
                        } else {
                          _selectedPlatforms.remove(platform);
                        }
                      });
                    },
                    title: Text(platform.toUpperCase()),
                    secondary: _getPlatformIcon(platform),
                    contentPadding: EdgeInsets.zero,
                  );
                }).toList(),
              ),
            ),
            SizedBox(height: 32),

            // Publish type selection
            Text(
              'Publish Type',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  RadioListTile(
                    value: false,
                    groupValue: _isScheduled,
                    onChanged: (value) => setState(() => _isScheduled = value ?? false),
                    title: Text('Publish Immediately'),
                    subtitle: Text('Post will be published right now'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  Divider(),
                  RadioListTile(
                    value: true,
                    groupValue: _isScheduled,
                    onChanged: (value) => setState(() => _isScheduled = value ?? false),
                    title: Text('Schedule for Later'),
                    subtitle: Text('Choose a specific date and time'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ],
              ),
            ),
            SizedBox(height: 24),

            // Schedule time picker
            if (_isScheduled) ...[
              Text(
                'Scheduled Time',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              GestureDetector(
                onTap: _selectDateTime,
                child: Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Color(0xFF10B981), width: 2),
                    borderRadius: BorderRadius.circular(8),
                    color: Color(0xFF10B981).withOpacity(0.05),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Select Date & Time',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          SizedBox(height: 4),
                          Text(
                            _scheduledTime != null
                                ? DateFormat('MMM dd, yyyy hh:mm a').format(_scheduledTime!)
                                : 'Not selected',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: _scheduledTime != null ? Colors.black : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                      Icon(Icons.calendar_today, color: Color(0xFF10B981)),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 24),
            ],

            // Summary
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ℹ️ Summary',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blue[900]),
                  ),
                  SizedBox(height: 8),
                  Text(
                    _isScheduled
                        ? 'Post will be published to ${_selectedPlatforms.join(", ").toUpperCase()} on ${DateFormat('MMM dd at hh:mm a').format(_scheduledTime ?? DateTime.now())}'
                        : 'Post will be published immediately to ${_selectedPlatforms.join(", ").toUpperCase()}',
                    style: TextStyle(fontSize: 13, color: Colors.blue[800]),
                  ),
                ],
              ),
            ),
            SizedBox(height: 32),

            // Publish button
            Consumer<PublishingProvider>(
              builder: (context, publishingProvider, _) {
                return SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: publishingProvider.isLoading ? null : _publish,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF10B981),
                    ),
                    child: publishingProvider.isLoading
                        ? SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            _isScheduled ? '📅 Schedule Post' : '🚀 Publish Now',
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

  Widget _getPlatformIcon(String platform) {
    switch (platform) {
      case 'twitter':
        return Icon(Icons.language, color: Color(0xFF1DA1F2));
      case 'linkedin':
        return Icon(Icons.work, color: Color(0xFF0A66C2));
      case 'facebook':
        return Icon(Icons.people, color: Color(0xFF1877F2));
      case 'instagram':
        return Icon(Icons.camera, color: Color(0xFFE4405F));
      default:
        return SizedBox.shrink();
    }
  }
}
