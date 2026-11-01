import { jsPDF } from 'jspdf';
import { GeneratedItinerary } from './types';
import { formatDateRange } from './trips';

  export async function exportTripAsPDF(
    trip: GeneratedItinerary,
    options?: { isElite?: boolean; agencyName?: string }
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const isElite = options?.isElite ?? false;
    const agencyName = options?.agencyName || 'Voyage AI Elite Concierge';

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        drawHeader();
      }
    };

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      if (isElite) {
        doc.setTextColor(217, 119, 6); // Amber
        doc.text(`★ ${agencyName.toUpperCase()}`, margin, y);
      } else {
        doc.setTextColor(99, 102, 241); // Primary indigo
        doc.text('VOYAGE AI', margin, y);
      }
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(isElite ? 'Executive Concierge Itinerary' : 'Smart Travel Itinerary', margin + (isElite ? 50 : 20), y);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin, y, { align: 'right' });
      y += 4;
      doc.setDrawColor(isElite ? 217 : 226, isElite ? 119 : 232, isElite ? 6 : 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // First page banner
    doc.setFillColor(15, 23, 42); // Dark slate
    doc.roundedRect(margin, y, contentWidth, 34, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(trip.tripTitle || `${trip.destination} Trip`, margin + 6, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(199, 215, 254);
    const routeText = `${trip.origin} -> ${trip.destination} | ${formatDateRange(trip.startDate, trip.endDate)} (${trip.totalDays} Days)`;
    doc.text(routeText, margin + 6, y + 20);

    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    const metaText = `Travelers: ${trip.travelers} | Total Budget: $${trip.budgetBreakdown.total.toLocaleString()} ${trip.budgetBreakdown.currency || 'USD'}`;
    doc.text(metaText, margin + 6, y + 27);

    y += 42;

    // Overview / Summary
    if (trip.summary) {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Overview', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const summaryLines = doc.splitTextToSize(trip.summary, contentWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4.5 + 4;
    }

    // Highlights
    if (trip.highlights && trip.highlights.length > 0) {
      checkPageBreak(30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('Trip Highlights', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      trip.highlights.forEach((h) => {
        checkPageBreak(6);
        doc.text(`* ${h}`, margin + 2, y);
        y += 5;
      });
      y += 4;
    }

    // Budget Breakdown Summary
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Budget Allocation', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const b = trip.budgetBreakdown;
    const budgetItems = [
      `Accommodation: $${b.accommodation.toLocaleString()}`,
      `Food & Dining: $${b.food.toLocaleString()}`,
      `Attractions: $${b.attractions.toLocaleString()}`,
      `Transport: $${b.transport.toLocaleString()}`,
      `Miscellaneous: $${b.miscellaneous.toLocaleString()}`,
    ];
    doc.text(budgetItems.join('   |   '), margin, y);
    y += 8;

    // Day by Day Plans
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(99, 102, 241);
    doc.text('Daily Itinerary', margin, y);
    y += 8;

    trip.days.forEach((day) => {
      checkPageBreak(50);

      // Day Header
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y - 4, contentWidth, 9, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`Day ${day.day}: ${day.theme} (${day.date})`, margin + 4, y + 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Est. Cost: ~$${day.estimatedDayCost}/person`, pageWidth - margin - 4, y + 2, { align: 'right' });
      y += 10;

      // Hotel
      if (day.hotel) {
        checkPageBreak(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(99, 102, 241);
        doc.text('Hotel:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(`${day.hotel.name} (${day.hotel.rating}*) - $${day.hotel.pricePerNight}/night - ${day.hotel.location}`, margin + 18, y);
        y += 5;
      }

      // Restaurants
      if (day.restaurants && day.restaurants.length > 0) {
        checkPageBreak(18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(234, 88, 12); // Orange
        doc.text('Dining:', margin + 2, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const restSummary = day.restaurants.map(r => `${r.name} (${r.mealType}: ${r.specialDish})`).join('; ');
        const restLines = doc.splitTextToSize(restSummary, contentWidth - 20);
        doc.text(restLines, margin + 18, y);
        y += restLines.length * 4.5 + 2;
      }

      // Attractions
      if (day.attractions && day.attractions.length > 0) {
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129); // Green
        doc.text('Activities:', margin + 2, y);
        y += 4;

        day.attractions.forEach((a) => {
          checkPageBreak(12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          doc.text(`* ${a.name} [${a.type}]`, margin + 6, y);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          const fee = a.entryFee === 0 ? 'Free' : `$${a.entryFee}`;
          doc.text(`${a.duration} | ${fee} | Best: ${a.bestTime}`, margin + 6, y + 4);
          y += 8;
        });
      }

      // Transport Tip
      if (day.transportTips) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Transport Tip: ${day.transportTips}`, margin + 4, y);
        y += 6;
      }

      y += 4;
    });

    // Emergency & Essential Info
    checkPageBreak(40);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Important Information & Contacts', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Local Currency: ${trip.currency} | Primary Language: ${trip.language} | Timezone: ${trip.timezone}`, margin, y);
    y += 5;
    doc.text(`Police: ${trip.emergencyContacts.police} | Ambulance: ${trip.emergencyContacts.ambulance} | Tourist Helpline: ${trip.emergencyContacts.touristHelpline}`, margin, y);
    y += 8;

    // Packing list summary
    if (trip.packingList && trip.packingList.length > 0) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text('Packing Essentials:', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const packingText = doc.splitTextToSize(trip.packingList.join(', '), contentWidth);
      doc.text(packingText, margin, y);
    }

    const safeFilename = `${trip.destination.replace(/[^a-zA-Z0-9]/g, '_')}_Itinerary.pdf`;
    doc.save(safeFilename);
  }

