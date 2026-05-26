import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geocoding/geocoding.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class MyAddressesPage extends StatefulWidget {
  const MyAddressesPage({super.key});

  @override
  State<MyAddressesPage> createState() => _MyAddressesPageState();
}

class _MyAddressesPageState extends State<MyAddressesPage> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  List<dynamic> _addresses = [];

  @override
  void initState() {
    super.initState();
    _fetchAddresses();
  }

  Future<void> _fetchAddresses() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final response = await _apiClient.get(ApiConstants.myAddresses);
      if (response['success'] == true) {
        setState(() {
          _addresses = response['data'] as List<dynamic>? ?? [];
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load addresses: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _setDefaultAddress(int id) async {
    try {
      final response = await _apiClient.put('${ApiConstants.addressBase}/$id/set-default');
      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Default address updated successfully'), backgroundColor: Colors.green),
        );
        _fetchAddresses();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to set default: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteAddress(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Address'),
        content: const Text('Are you sure you want to delete this address? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        final response = await _apiClient.delete('${ApiConstants.addressBase}/$id');
        if (response['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Address deleted successfully'), backgroundColor: Colors.green),
          );
          _fetchAddresses();
        }
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showAddressForm({Map<String, dynamic>? editAddress}) {
    final formKey = GlobalKey<FormState>();
    final contactNameController = TextEditingController(text: editAddress?['contact_name'] ?? '');
    final contactNumberController = TextEditingController(text: editAddress?['contact_number'] ?? '');
    final locationNameController = TextEditingController(text: editAddress?['location_name'] ?? '');
    final addressController = TextEditingController(text: editAddress?['address'] ?? '');
    final addressDetailsController = TextEditingController(text: editAddress?['address_details'] ?? '');
    
    double initialLat = double.tryParse((editAddress?['latitude'] ?? 17.4835027).toString()) ?? 17.4835027;
    double initialLng = double.tryParse((editAddress?['longitude'] ?? 78.3807155).toString()) ?? 78.3807155;

    final latController = TextEditingController(text: initialLat.toString());
    final lngController = TextEditingController(text: initialLng.toString());

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (sheetContext, setSheetState) => Container(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
            top: 24,
            left: 24,
            right: 24,
          ),
          decoration: const BoxDecoration(
            color: AppColors.backgroundLightPurple,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          child: SingleChildScrollView(
            child: Form(
              key: formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        editAddress == null ? 'Add New Address' : 'Edit Address',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.black),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(sheetContext).pop(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  _buildLabel('Location Name (e.g. Home, Office)'),
                  _buildTextField(hint: 'Enter Location Name', controller: locationNameController),
                  
                  _buildLabel('Contact Person Name'),
                  _buildTextField(hint: 'Enter Contact Name', controller: contactNameController),
                  
                  _buildLabel('Contact Number'),
                  _buildTextField(hint: 'Enter Contact Number', controller: contactNumberController),
                  
                  // Map Picker Button
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.primaryPink, width: 1.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        minimumSize: const Size(double.infinity, 50),
                      ),
                      icon: const Icon(Icons.map_outlined, color: AppColors.primaryPink),
                      label: const Text(
                        'Pick Location on Google Map',
                        style: TextStyle(color: AppColors.primaryPink, fontWeight: FontWeight.bold),
                      ),
                      onPressed: () async {
                        final LatLng? picked = await Navigator.push<LatLng>(
                          context,
                          MaterialPageRoute(
                            builder: (context) => MapPickerScreen(
                              initialLat: double.tryParse(latController.text) ?? 17.4835027,
                              initialLng: double.tryParse(lngController.text) ?? 78.3807155,
                            ),
                          ),
                        );

                        if (picked != null) {
                          setSheetState(() {
                            latController.text = picked.latitude.toStringAsFixed(7);
                            lngController.text = picked.longitude.toStringAsFixed(7);
                          });

                          // Reverse geocode to get Address description
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Retrieving address from picked coordinates...'), duration: Duration(seconds: 1)),
                          );

                          try {
                            List<Placemark> placemarks = await placemarkFromCoordinates(picked.latitude, picked.longitude);
                            if (placemarks.isNotEmpty) {
                              final p = placemarks.first;
                              String computedAddress = "";
                              if (p.name != null && p.name!.isNotEmpty) computedAddress += "${p.name}, ";
                              if (p.street != null && p.street!.isNotEmpty) computedAddress += "${p.street}, ";
                              if (p.subLocality != null && p.subLocality!.isNotEmpty) computedAddress += "${p.subLocality}, ";
                              if (p.locality != null && p.locality!.isNotEmpty) computedAddress += "${p.locality}, ";
                              if (p.administrativeArea != null && p.administrativeArea!.isNotEmpty) computedAddress += "${p.administrativeArea}, ";
                              if (p.postalCode != null && p.postalCode!.isNotEmpty) computedAddress += "${p.postalCode}, ";
                              if (p.country != null && p.country!.isNotEmpty) computedAddress += p.country!;

                              computedAddress = computedAddress.replaceAll(RegExp(r',\s*,'), ',').trim();
                              if (computedAddress.endsWith(',')) {
                                computedAddress = computedAddress.substring(0, computedAddress.length - 1);
                              }

                              setSheetState(() {
                                addressController.text = computedAddress;
                              });
                            }
                          } catch (e) {
                            setSheetState(() {
                              addressController.text = "Latitude: ${picked.latitude}, Longitude: ${picked.longitude}";
                            });
                          }
                        }
                      },
                    ),
                  ),

                  _buildLabel('Full Address'),
                  _buildTextField(hint: 'Address will auto-populate', controller: addressController),
                  
                  _buildLabel('Address Details / Landmark'),
                  _buildTextField(hint: 'Enter Address Details', controller: addressDetailsController),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Latitude'),
                            _buildTextField(
                              hint: '0.0',
                              controller: latController,
                              readOnly: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Longitude'),
                            _buildTextField(
                              hint: '0.0',
                              controller: lngController,
                              readOnly: true,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryPink,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () async {
                        if (!formKey.currentState!.validate()) return;
                        
                        final body = {
                          "address": addressController.text.trim(),
                          "address_details": addressDetailsController.text.trim(),
                          "contact_name": contactNameController.text.trim(),
                          "contact_number": contactNumberController.text.trim(),
                          "location_name": locationNameController.text.trim(),
                          "latitude": double.tryParse(latController.text) ?? 0.0,
                          "longitude": double.tryParse(lngController.text) ?? 0.0,
                        };

                        try {
                          Map<String, dynamic> res;
                          if (editAddress == null) {
                            res = await _apiClient.post(ApiConstants.addAddress, body: body);
                          } else {
                            res = await _apiClient.put('${ApiConstants.addressBase}/${editAddress['id']}', body: body);
                          }

                          if (res['success'] == true) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(editAddress == null ? 'Address added successfully' : 'Address updated successfully'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                              Navigator.of(sheetContext).pop();
                              _fetchAddresses();
                            }
                          }
                        } catch (e) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to save address: $e'), backgroundColor: Colors.red),
                          );
                        }
                      },
                      child: const Text('Save Address', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 12, bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.black),
      ),
    );
  }

  Widget _buildTextField({
    required String hint,
    TextEditingController? controller,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      validator: (v) => v!.isEmpty ? 'Required' : null,
      style: TextStyle(color: readOnly ? Colors.grey.shade600 : AppColors.black),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.grey, fontSize: 14),
        filled: true,
        fillColor: readOnly ? Colors.grey.shade100 : AppColors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text('My Addresses', style: TextStyle(color: AppColors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.primaryPink),
            onPressed: () => _showAddressForm(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryPink))
          : _addresses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_off_outlined, size: 64, color: AppColors.grey.withOpacity(0.5)),
                      const SizedBox(height: 16),
                      const Text('No addresses saved yet', style: TextStyle(fontSize: 16, color: AppColors.grey)),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                        onPressed: () => _showAddressForm(),
                        icon: const Icon(Icons.add, color: Colors.white),
                        label: const Text('Add Address', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _addresses.length,
                  itemBuilder: (ctx, index) {
                    final item = _addresses[index];
                    final bool isDefault = item['is_default'] ?? false;
                    final int id = item['id'];

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      item['location_name'].toString().toLowerCase() == 'home'
                                          ? Icons.home_outlined
                                          : item['location_name'].toString().toLowerCase() == 'office'
                                              ? Icons.business_outlined
                                              : Icons.location_on_outlined,
                                      color: AppColors.primaryPink,
                                      size: 24,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      item['location_name'] ?? 'Address',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.black),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined, color: AppColors.grey, size: 20),
                                      onPressed: () => _showAddressForm(editAddress: item),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                      onPressed: () => _deleteAddress(id),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            Text(
                              item['address'] ?? '',
                              style: const TextStyle(fontSize: 14, color: Color(0xFF333333), height: 1.4),
                            ),
                            if (item['address_details'] != null && item['address_details'].toString().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  'Landmark: ${item['address_details']}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.grey),
                                ),
                              ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Contact: ${item['contact_name'] ?? ""}',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.black),
                                    ),
                                    Text(
                                      'Phone: ${item['contact_number'] ?? ""}',
                                      style: const TextStyle(fontSize: 13, color: AppColors.grey),
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Radio<int>(
                                      value: id,
                                      groupValue: _addresses.firstWhere((a) => a['is_default'] == true, orElse: () => {'id': -1})['id'],
                                      activeColor: AppColors.primaryPink,
                                      onChanged: (v) {
                                        if (v != null) {
                                          _setDefaultAddress(v);
                                        }
                                      },
                                    ),
                                    const Text('Default', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.black)),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class MapPickerScreen extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  const MapPickerScreen({super.key, required this.initialLat, required this.initialLng});

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  late LatLng _currentPosition;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _currentPosition = LatLng(
      widget.initialLat == 0.0 ? 17.4835027 : widget.initialLat,
      widget.initialLng == 0.0 ? 78.3807155 : widget.initialLng,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pick Location on Map', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: _currentPosition,
              zoom: 15,
            ),
            onMapCreated: (controller) => _mapController = controller,
            onCameraMove: (position) {
              setState(() {
                _currentPosition = position.target;
              });
            },
            myLocationButtonEnabled: true,
            myLocationEnabled: true,
          ),
          const Center(
            child: Padding(
              padding: EdgeInsets.only(bottom: 36),
              child: Icon(
                Icons.location_on,
                color: AppColors.primaryPink,
                size: 48,
              ),
            ),
          ),
          Positioned(
            bottom: 24,
            left: 24,
            right: 24,
            child: SizedBox(
              height: 54,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryPink,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () => Navigator.of(context).pop(_currentPosition),
                child: const Text(
                  'Confirm Location',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
