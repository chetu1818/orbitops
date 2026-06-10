import { Directive, ElementRef, OnInit, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  private observer?: IntersectionObserver;

  constructor(
    private el: ElementRef, 
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    // Inject global scroll animation base class
    this.renderer.addClass(this.el.nativeElement, 'animate-on-scroll');

    // Configure the intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply in-view class to trigger transition keyframes
            this.renderer.addClass(this.el.nativeElement, 'in-view');
            
            // Disconnect observation for this node to free memory
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -60px 0px' // Offset slightly so it triggers cleanly as user scrolls down
      }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
