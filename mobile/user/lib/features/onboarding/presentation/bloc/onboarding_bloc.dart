import 'package:flutter_bloc/flutter_bloc.dart';
import 'onboarding_event.dart';
import 'onboarding_state.dart';

class OnboardingBloc extends Bloc<OnboardingEvent, OnboardingState> {
  OnboardingBloc() : super(const OnboardingState()) {
    on<PageChanged>((event, emit) {
      emit(state.copyWith(pageIndex: event.pageIndex));
    });

    on<NextPageSelected>((event, emit) {
      if (state.pageIndex < 2) {
        emit(state.copyWith(pageIndex: state.pageIndex + 1));
      }
    });
  }
}
