import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';

class BookingPage extends StatefulWidget {
  final String vetId;
  final Map<String, dynamic>? vetData;

  const BookingPage({super.key, required this.vetId, this.vetData});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  final ApiClient _apiClient = ApiClient();
  final TextEditingController _reasonController = TextEditingController();

  bool _isLoading = true;
  bool _isSubmitting = false;
  String? _errorMessage;

  // grouped slots: date -> list of slots
  final Map<String, List<Map<String, dynamic>>> _slotsByDate = {};
  List<String> _dates = [];
  List<dynamic> _addresses = [];
  List<dynamic> _pets = [];

  String? _selectedDate;
  Map<String, dynamic>? _selectedSlot;
  int? _selectedAddressId;
  int? _selectedPetId;
  int? _selectedServiceId;
  String? _selectedVisitType;
  bool _isEmergency = false;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _slotsByDate.clear();
      _dates = [];
      _addresses = [];
      _pets = [];
    });
    if (widget.vetId.isEmpty || widget.vetId == 'null') {
      setState(() {
        _errorMessage = 'Vet id missing. Open booking from a vet card.';
        _isLoading = false;
      });
      return;
    }

    const apiTimeout = Duration(seconds: 15);
    String? slotsError;

    try {
      final slotsResponse = await _apiClient.get(
        ApiConstants.availabilitySlots(widget.vetId),
        queryParameters: {'days': '7', 'debug': 'false'},
      ).timeout(apiTimeout);

      final slotsData = slotsResponse['data'];
      if (slotsData is List) {
        for (final s in slotsData) {
          if (s is Map<String, dynamic>) {
            final date = s['date'] as String? ?? '';
            if (date.isEmpty) continue;
            _slotsByDate.putIfAbsent(date, () => []).add(s);
          }
        }
        _dates = _slotsByDate.keys.toList()..sort();
      }
    } catch (e) {
      slotsError = e.toString();
    }

    try {
      final addressesResponse =
          await _apiClient.get(ApiConstants.myAddresses).timeout(apiTimeout);
      final addrData = addressesResponse['data'];
      if (addrData is List) _addresses = addrData;
    } catch (_) {
      // non-fatal; user can still attempt to book with another path
    }

    try {
      final petsResponse =
          await _apiClient.get(ApiConstants.myPets).timeout(apiTimeout);
      final petsData = petsResponse['data'];
      if (petsData is List) {
        _pets = petsData;
      } else if (petsData is Map && petsData['pets'] is List) {
        _pets = (petsData['pets'] as List);
      }
    } catch (_) {
      // non-fatal
    }

    if (!mounted) return;
    setState(() {
      if (_dates.isEmpty && slotsError != null) {
        _errorMessage = 'Failed to load slots: $slotsError';
      } else {
        _selectedDate = _dates.isNotEmpty ? _dates.first : null;
      }
      _isLoading = false;
    });
  }

  List<Map<String, dynamic>> _currentSlots() {
    if (_selectedDate == null) return [];
    return _slotsByDate[_selectedDate] ?? [];
  }

  List<String> _visitTypesForSelectedSlot() {
    final allowed = _selectedSlot?['allowed_visit_types'];
    if (allowed is List) return allowed.map((e) => e.toString()).toList();
    return const [];
  }

  List<Map<String, dynamic>> _vetServices() {
    final services = widget.vetData?['services'];
    if (services is List) {
      return services.whereType<Map<String, dynamic>>().toList();
    }
    return const [];
  }

  Future<void> _confirm() async {
    final missing = <String>[];
    if (_selectedSlot == null) missing.add('time slot');
    if (_selectedAddressId == null) missing.add('address');
    if (_selectedPetId == null) missing.add('pet');
    if (_selectedVisitType == null || _selectedVisitType!.isEmpty) missing.add('visit type');
    if (_selectedServiceId == null) missing.add('service');
    if (missing.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select: ${missing.join(', ')}')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final body = {
        'vet_id': int.tryParse(widget.vetId) ?? 0,
        'appointment_date': _selectedDate,
        'start_time': _selectedSlot!['start_time'],
        'end_time': _selectedSlot!['end_time'],
        'visit_type': _selectedVisitType,
        'service_id': _selectedServiceId,
        'pet_id': _selectedPetId,
        'address_id': _selectedAddressId,
        'reason': _reasonController.text.trim(),
        'is_emergency': _isEmergency,
      };
      final response = await _apiClient.post(ApiConstants.addAppointment, body: body);
      if (!mounted) return;
      if (response['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment booked'), backgroundColor: Colors.green),
        );
        context.go('/appointment-confirmation');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response['message']?.toString() ?? 'Booking failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text('Book Appointment', style: TextStyle(color: AppColors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primaryPink));
    }
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: AppColors.grey, size: 48),
              const SizedBox(height: 12),
              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.grey)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadAll,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryPink),
                child: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildVetCard(),
          const SizedBox(height: 20),
          _buildLabel('Select Date'),
          _buildDateSelector(),
          const SizedBox(height: 20),
          _buildLabel('Select Time'),
          _buildSlotsGrid(),
          const SizedBox(height: 20),
          _buildLabel('Visit Type'),
          _buildVisitTypeDropdown(),
          const SizedBox(height: 16),
          _buildLabel('Service'),
          _buildServiceDropdown(),
          const SizedBox(height: 16),
          _buildLabel('Select Pet'),
          _buildPetDropdown(),
          const SizedBox(height: 16),
          _buildLabel('Select Address'),
          _buildAddressList(),
          const SizedBox(height: 16),
          _buildLabel('Reason (optional)'),
          TextField(
            controller: _reasonController,
            maxLines: 2,
            decoration: InputDecoration(
              hintText: 'Describe the reason for visit',
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Switch(
                value: _isEmergency,
                activeThumbColor: AppColors.primaryPink,
                onChanged: (v) => setState(() => _isEmergency = v),
              ),
              const Text('Emergency'),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _confirm,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryPink,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Confirm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildVetCard() {
    final name = widget.vetData?['vet_name'] as String? ?? widget.vetData?['name'] as String? ?? 'Vet';
    final profile = widget.vetData?['vet_profile'] as String? ?? widget.vetData?['profile_picture'] as String?;
    final clinic = widget.vetData?['clinic'] as Map<String, dynamic>?;
    final address = clinic?['address'] as String? ?? '';
    return Row(
      children: [
        CircleAvatar(
          radius: 26,
          backgroundColor: const Color(0xFFEDEFFB),
          backgroundImage: (profile != null && profile.isNotEmpty)
              ? NetworkImage(profile)
              : const AssetImage('assets/profile.png') as ImageProvider,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              if (address.isNotEmpty)
                Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.red, size: 14),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        address,
                        style: const TextStyle(color: AppColors.grey, fontSize: 12),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
    );
  }

  Widget _buildDateSelector() {
    if (_dates.isEmpty) {
      return const Text('No available dates', style: TextStyle(color: AppColors.grey));
    }
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _dates.map((date) {
          final isSelected = _selectedDate == date;
          final parts = date.split('-');
          final day = parts.length == 3 ? parts[2] : date;
          final month = parts.length == 3 ? _shortMonth(int.tryParse(parts[1]) ?? 1) : '';
          return GestureDetector(
            onTap: () => setState(() {
              _selectedDate = date;
              _selectedSlot = null;
              _selectedVisitType = null;
            }),
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primaryPink : AppColors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isSelected ? AppColors.primaryPink : Colors.grey[300]!),
              ),
              child: Column(
                children: [
                  Text(month, style: TextStyle(color: isSelected ? Colors.white : AppColors.black, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(
                    day,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: isSelected ? Colors.white : AppColors.black),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _shortMonth(int m) {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (m >= 1 && m <= 12) ? names[m - 1] : '';
  }

  String _formatTime(String? raw) {
    if (raw == null) return '';
    final parts = raw.split(':');
    if (parts.length < 2) return raw;
    final h = int.tryParse(parts[0]) ?? 0;
    final mm = parts[1];
    final period = h >= 12 ? 'PM' : 'AM';
    final h12 = h % 12 == 0 ? 12 : h % 12;
    return '$h12:$mm $period';
  }

  Widget _buildSlotsGrid() {
    final slots = _currentSlots();
    if (slots.isEmpty) {
      return const Text('No slots for this date', style: TextStyle(color: AppColors.grey));
    }
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.2,
      children: slots.map((slot) {
        final isAvailable = (slot['status'] as String?) == 'available';
        final isSelected = identical(slot, _selectedSlot);
        final label = _formatTime(slot['start_time'] as String?);
        return GestureDetector(
          onTap: isAvailable
              ? () => setState(() {
                    _selectedSlot = slot;
                    _selectedVisitType = null;
                  })
              : null,
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primaryPink : (isAvailable ? AppColors.white : Colors.grey[200]),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: isSelected ? AppColors.primaryPink : (isAvailable ? Colors.green : Colors.transparent)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: TextStyle(color: isSelected ? Colors.white : AppColors.black, fontSize: 12, fontWeight: FontWeight.bold)),
                Text(
                  isAvailable ? 'Available' : 'Booked',
                  style: TextStyle(color: isSelected ? Colors.white : (isAvailable ? Colors.green : AppColors.grey), fontSize: 9),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildVisitTypeDropdown() {
    final visitTypes = _visitTypesForSelectedSlot();
    if (visitTypes.isEmpty) {
      return _hintBox(_selectedSlot == null ? 'Select a time slot first' : 'No visit types for this slot');
    }
    return _outlineBox(
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: visitTypes.contains(_selectedVisitType) ? _selectedVisitType : null,
          hint: const Text('Select Visit Type', style: TextStyle(color: AppColors.grey)),
          isExpanded: true,
          items: visitTypes
              .map((t) => DropdownMenuItem(value: t, child: Text(t)))
              .toList(),
          onChanged: (v) => setState(() => _selectedVisitType = v),
        ),
      ),
    );
  }

  Widget _buildServiceDropdown() {
    final services = _vetServices();
    if (services.isEmpty) {
      return _hintBox('No services available');
    }
    return _outlineBox(
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: services.any((s) => s['id'] == _selectedServiceId) ? _selectedServiceId : null,
          hint: const Text('Select Service', style: TextStyle(color: AppColors.grey)),
          isExpanded: true,
          items: services.map((s) {
            final id = s['id'] as int?;
            final name = s['name'] as String? ?? '';
            return DropdownMenuItem(value: id, child: Text(name));
          }).toList(),
          onChanged: (v) => setState(() => _selectedServiceId = v),
        ),
      ),
    );
  }

  Widget _buildPetDropdown() {
    if (_pets.isEmpty) {
      return _hintBox('No pets added yet');
    }
    return _outlineBox(
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: _pets.any((p) => p['id'] == _selectedPetId) ? _selectedPetId : null,
          hint: const Text('Select Pet', style: TextStyle(color: AppColors.grey)),
          isExpanded: true,
          items: _pets.map<DropdownMenuItem<int>>((p) {
            final id = p['id'] as int?;
            final name = p['name'] as String? ?? 'Pet';
            return DropdownMenuItem(value: id, child: Text(name));
          }).toList(),
          onChanged: (v) => setState(() => _selectedPetId = v),
        ),
      ),
    );
  }

  Widget _buildAddressList() {
    if (_addresses.isEmpty) {
      return _hintBox('No addresses added yet');
    }
    return Column(
      children: _addresses.map<Widget>((a) {
        final id = a['id'] as int?;
        final line1 = (a['address_line1'] ?? a['line1'] ?? a['address'] ?? '').toString();
        final city = (a['city'] ?? '').toString();
        final label = [line1, city].where((s) => s.isNotEmpty).join(', ');
        final isSelected = _selectedAddressId == id;
        return GestureDetector(
          onTap: () => setState(() => _selectedAddressId = id),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primaryPink.withValues(alpha: 0.08) : AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? AppColors.primaryPink : Colors.grey[300]!),
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                  color: isSelected ? AppColors.primaryPink : AppColors.grey,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(label.isNotEmpty ? label : 'Address #$id'),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _hintBox(String text) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text, style: const TextStyle(color: AppColors.grey)),
    );
  }

  Widget _outlineBox({required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: child,
    );
  }
}
