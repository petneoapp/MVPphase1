import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class PetDetailsPage extends StatefulWidget {
  const PetDetailsPage({super.key});

  @override
  State<PetDetailsPage> createState() => _PetDetailsPageState();
}

class _PetDetailsPageState extends State<PetDetailsPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _petNameController = TextEditingController();
  final TextEditingController _dobController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _licenceController = TextEditingController();
  
  final ApiClient _apiClient = ApiClient();
  File? _imageFile;

  bool _isLoadingSpecies = true;
  bool _isSubmitting = false;
  List<dynamic> _speciesData = [];
  List<String> _types = [];
  List<String> _availableBreeds = [];

  String? _selectedType;
  String? _selectedBreed;
  int? _selectedBreedId;
  String? _selectedGender;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _fetchSpecies();
  }

  @override
  void dispose() {
    _petNameController.dispose();
    _dobController.dispose();
    _weightController.dispose();
    _licenceController.dispose();
    super.dispose();
  }

  Future<void> _fetchSpecies() async {
    try {
      final response = await _apiClient.get(ApiConstants.species);
      if (response['success'] == true) {
        final data = response['data'] as List<dynamic>?;
        if (data != null) {
          setState(() {
            _speciesData = data;
            _types = data.map((e) => e['Type'] as String).toList();
            _isLoadingSpecies = false;
          });
        }
      } else {
        setState(() {
          _isLoadingSpecies = false;
        });
      }
    } catch (_) {
      setState(() {
        _isLoadingSpecies = false;
      });
    }
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _imageFile = File(image.path);
      });
    }
  }

  void _showDatePicker() {
    showCupertinoModalPopup(
      context: context,
      builder: (_) => Container(
        height: 300,
        color: const Color.fromARGB(255, 255, 255, 255),
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: CupertinoDatePicker(
                mode: CupertinoDatePickerMode.date,
                initialDateTime: DateTime.now(),
                onDateTimeChanged: (val) {
                  setState(() {
                    _selectedDate = val;
                    _dobController.text = "${val.day}/${val.month}/${val.year}";
                  });
                },
              ),
            ),
            CupertinoButton(
              child: const Text('OK'),
              onPressed: () => Navigator.of(context).pop(),
            )
          ],
        ),
      ),
    );
  }

  Future<void> _submitPet() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedBreedId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a valid Breed'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final formattedDob = _selectedDate != null 
          ? "${_selectedDate!.year}-${_selectedDate!.month.toString().padLeft(2, '0')}-${_selectedDate!.day.toString().padLeft(2, '0')}"
          : "";

      final response = await _apiClient.postMultipart(
        ApiConstants.addPet,
        fields: {
          'name': _petNameController.text.trim(),
          'species': _selectedType ?? '',
          'breed_id': _selectedBreedId.toString(),
          'gender': _selectedGender ?? '',
          'date_of_birth': formattedDob,
          'weight': _weightController.text.trim(),
          'licence': _licenceController.text.trim(),
        },
        filePath: _imageFile?.path,
        fileKey: 'profile_picture',
      );

      if (response['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Pet added successfully'),
              backgroundColor: Colors.green,
            ),
          );
          context.go('/registration-success');
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response['message'] ?? 'Failed to add pet'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingSpecies) {
      return const Scaffold(
        backgroundColor: AppColors.backgroundLightPurple,
        body: Center(
          child: CircularProgressIndicator(
            color: AppColors.primaryPink,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pet Name
              _buildLabel('Pet Name'),
              _buildTextField(hint: 'Enter Pet Name', controller: _petNameController),
              
              const SizedBox(height: 8),
              
              // Type and Breed side by side
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Type'),
                        _buildDropdownField(
                          hint: 'Select Type',
                          items: _types,
                          value: _selectedType,
                          onChanged: (v) {
                            setState(() {
                              _selectedType = v;
                              _selectedBreed = null;
                              _selectedBreedId = null;
                              final selectedSpecies = _speciesData.firstWhere(
                                (element) => element['Type'] == v,
                                orElse: () => null,
                              );
                              if (selectedSpecies != null) {
                                final breedList = selectedSpecies['breeds'] as List<dynamic>?;
                                _availableBreeds = breedList != null
                                    ? breedList.map((b) => b['name'] as String).toList()
                                    : [];
                              } else {
                                _availableBreeds = [];
                              }
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Breed'),
                        _buildDropdownField(
                          hint: _selectedType == null ? 'Select Type first' : 'Select Breed',
                          items: _availableBreeds,
                          value: _selectedBreed,
                          onChanged: (v) {
                            setState(() {
                              _selectedBreed = v;
                              final selectedSpecies = _speciesData.firstWhere(
                                (element) => element['Type'] == _selectedType,
                                orElse: () => null,
                              );
                              if (selectedSpecies != null) {
                                final breedList = selectedSpecies['breeds'] as List<dynamic>?;
                                if (breedList != null) {
                                  final breedObj = breedList.firstWhere(
                                    (b) => b['name'] == v,
                                    orElse: () => null,
                                  );
                                  if (breedObj != null) {
                                    _selectedBreedId = breedObj['id'] as int?;
                                  }
                                }
                              }
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              // Date Of Birth
              _buildLabel('Date Of Birth'),
              _buildTextField(
                hint: 'Enter Date Of Birth',
                controller: _dobController,
                readOnly: true,
                onTap: _showDatePicker,
              ),
              
              // Gender
              _buildLabel('Gender'),
              _buildDropdownField(
                hint: 'Select Gender',
                items: const ['Male', 'Female'],
                value: _selectedGender,
                onChanged: (v) {
                  setState(() {
                    _selectedGender = v;
                  });
                },
              ),
              
              // Pet Weight
              _buildLabel('Pet Weight'),
              _buildTextField(
                hint: 'Enter Pet Weight',
                controller: _weightController,
                suffixText: 'kg',
              ),
              
              // Pet Licence
              _buildLabel('Pet Licence'),
              _buildTextField(
                hint: 'Enter Pet Licence Number',
                controller: _licenceController,
              ),
              
              // Upload Photo
              _buildLabel('Upload Pet Photo'),
              _buildUploadContainer(),
              
              const SizedBox(height: 40),
              
              // Next Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitPet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryPink,
                    disabledBackgroundColor: AppColors.primaryPink.withOpacity(0.6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Next',
                          style: TextStyle(
                            fontSize: 18,
                            color: AppColors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: AppColors.black,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String hint,
    TextEditingController? controller,
    bool readOnly = false,
    VoidCallback? onTap,
    String? suffixText,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      onTap: onTap,
      validator: (v) => v!.isEmpty ? 'Required' : null,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.grey),
        filled: true,
        fillColor: AppColors.white,
        suffixText: suffixText,
        suffixStyle: const TextStyle(
          color: AppColors.primaryPink,
          fontWeight: FontWeight.bold,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildDropdownField({
    required String hint,
    required List<String> items,
    String? value,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(
        filled: true,
        fillColor: AppColors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      hint: Text(
        hint,
        style: const TextStyle(color: AppColors.grey, fontSize: 13),
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
      ),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, overflow: TextOverflow.ellipsis))).toList(),
      onChanged: onChanged,
      validator: (v) => v == null ? 'Required' : null,
    );
  }

  Widget _buildUploadContainer() {
    return GestureDetector(
      onTap: _pickImage,
      child: Container(
        width: double.infinity,
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          image: _imageFile != null
              ? DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover)
              : null,
          border: Border.all(
            color: AppColors.grey.withOpacity(0.5),
            style: BorderStyle.solid,
            width: 1,
          ),
        ),
        child: _imageFile == null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryPink.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.image_outlined, color: AppColors.primaryPink),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Click To Upload',
                    style: TextStyle(
                      color: AppColors.primaryPink,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Max File Size: 10 MB',
                    style: TextStyle(color: AppColors.grey, fontSize: 12),
                  ),
                ],
              )
            : null,
      ),
    );
  }
}
