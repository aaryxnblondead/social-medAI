import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/brand_provider.dart';

class BrandScreen extends StatefulWidget {
  @override
  State<BrandScreen> createState() => _BrandScreenState();
}

class _BrandScreenState extends State<BrandScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BrandProvider>(context, listen: false).fetchBrands();
    });
  }

  void _showCreateBrandDialog() {
    final formKey = GlobalKey<FormState>();
    final nameCtrl = TextEditingController();
    final industryCtrl = TextEditingController();
    final audienceCtrl = TextEditingController();
    final toneCtrl = TextEditingController();
    final keywordsCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Create Brand'),
        content: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: nameCtrl,
                  decoration: InputDecoration(hintText: 'Brand Name'),
                  validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                ),
                SizedBox(height: 12),
                TextFormField(
                  controller: industryCtrl,
                  decoration: InputDecoration(hintText: 'Industry'),
                  validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                ),
                SizedBox(height: 12),
                TextFormField(
                  controller: audienceCtrl,
                  decoration: InputDecoration(hintText: 'Target Audience'),
                  validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                ),
                SizedBox(height: 12),
                TextFormField(
                  controller: toneCtrl,
                  decoration: InputDecoration(hintText: 'Voice Tone'),
                  validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                ),
                SizedBox(height: 12),
                TextFormField(
                  controller: keywordsCtrl,
                  decoration: InputDecoration(hintText: 'Keywords (comma-separated)'),
                  maxLines: 2,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState!.validate()) {
                final brandProvider = Provider.of<BrandProvider>(context, listen: false);
                await brandProvider.createBrand({
                  'brandName': nameCtrl.text,
                  'industry': industryCtrl.text,
                  'targetAudience': audienceCtrl.text,
                  'brandVoice': toneCtrl.text,
                  'keywords': keywordsCtrl.text,
                });
                Navigator.pop(context);
                if (brandProvider.error == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Brand created!')),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: \${brandProvider.error}')),
                  );
                }
              }
            },
            child: Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Select Brand'),
        actions: [
          IconButton(
            icon: Icon(Icons.add),
            onPressed: _showCreateBrandDialog,
          ),
        ],
      ),
      body: Consumer<BrandProvider>(
        builder: (context, brandProvider, _) {
          if (brandProvider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }

          if (brandProvider.brands.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.business, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No brands yet', style: TextStyle(fontSize: 16, color: Colors.grey)),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _showCreateBrandDialog,
                    child: Text('Create First Brand'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: EdgeInsets.all(16),
            itemCount: brandProvider.brands.length,
            itemBuilder: (context, index) {
              final brand = brandProvider.brands[index];
              final isSelected = brandProvider.selectedBrand?.id == brand.id;

              return Card(
                color: isSelected ? Color(0xFF10B981) : Colors.white,
                child: ListTile(
                  title: Text(
                    brand.brandName,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.black,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Industry: ${brand.industry}',
                        style: TextStyle(color: isSelected ? Colors.white70 : Colors.grey),
                      ),
                      Text(
                        'Tone: ${brand.brandVoice}',
                        style: TextStyle(color: isSelected ? Colors.white70 : Colors.grey),
                      ),
                    ],
                  ),
                  onTap: () {
                    brandProvider.selectBrand(brand);
                    Navigator.pop(context);
                  },
                  trailing: isSelected
                      ? Icon(Icons.check_circle, color: Colors.white)
                      : Icon(Icons.radio_button_unchecked, color: Colors.grey),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
