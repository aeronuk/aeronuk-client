import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BookingFlowService } from '../shared/services/booking-flow.service';

@Component({
  selector: 'app-passenger-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './passenger-form.component.html',
  styleUrl: './passenger-form.component.css',
})
export class PassengerFormComponent {
  protected flow   = inject(BookingFlowService);
  private router = inject(Router);

  submitted = signal(false);

  form = new FormGroup({
    title:       new FormControl('',  Validators.required),
    firstName:   new FormControl('',  Validators.required),
    lastName:    new FormControl('',  Validators.required),
    dob:         new FormControl('',  Validators.required),
    nationality: new FormControl('',  Validators.required),
    email:       new FormControl('',  [Validators.required, Validators.email]),
    mobile:      new FormControl('',  Validators.required),
  });

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return this.submitted() && !!c && c.invalid;
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    const v = this.form.value;
    this.flow.setPassengerDraft({
      title:       v.title!,
      firstName:   v.firstName!,
      lastName:    v.lastName!,
      dob:         v.dob!,
      nationality: v.nationality!,
      email:       v.email!,
      mobile:      v.mobile!,
    });
    this.router.navigate(['/booking/seats']);
  }
}
