import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/petneo_header.dart';

class EmergencyInfoClinicPage extends StatefulWidget {
  const EmergencyInfoClinicPage({super.key});

  @override
  State<EmergencyInfoClinicPage> createState() => _EmergencyInfoClinicPageState();
}

class _EmergencyInfoClinicPageState extends State<EmergencyInfoClinicPage> {
  int _visitType = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLightPurple,
      appBar: const PetneoAppBar(title: 'Emergency Info'),
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 140),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 32,
                      backgroundImage: AssetImage('assets/profile.png'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Neo Care Clinic', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('2 Years old', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                          const SizedBox(height: 4),
                          Row(
                            children: const [
                              Icon(Icons.star, color: Colors.amber, size: 14),
                              SizedBox(width: 4),
                              Text('5.0', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              SizedBox(width: 4),
                              Text('(150 Ratings)', style: TextStyle(color: Colors.black54, fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const Text('Reason of Emergency', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _dropdown('Select Reason'),
              const SizedBox(height: 16),
              const Text('Visit Type', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(child: _visitTypeBtn('Clinic', 0)),
                  const SizedBox(width: 12),
                  Expanded(child: _visitTypeBtn('Home Visit', 1)),
                ],
              ),
              const SizedBox(height: 16),
              const Text('Select Pet', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _dropdown('Select Pet'),
              const SizedBox(height: 100),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => context.push('/get-directions'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryPink,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Schedule now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _dropdown(String hint) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          hint: Text(hint, style: TextStyle(color: Colors.grey.shade500)),
          isExpanded: true,
          items: const [],
          onChanged: (_) {},
        ),
      ),
    );
  }

  Widget _visitTypeBtn(String label, int index) {
    final selected = _visitType == index;
    return GestureDetector(
      onTap: () => setState(() => _visitType = index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? AppColors.primaryPink : Colors.grey.shade300,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? AppColors.primaryPink : Colors.black87,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
