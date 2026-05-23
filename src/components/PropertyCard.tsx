import React, { useState } from "react";
import { Heart, Layers, MapPin, Eye, Compass, Phone, ShieldCheck, Video, Check } from "lucide-react";
import { Property } from "../types";

interface PropertyCardProps {
  key?: React.Key;
  property: Property;
  isFavorite: boolean;
  isComparing: boolean;
  onToggleFavorite: () => void;
  onToggleCompare: () => void;
  onQuickView: () => void;
}

export default function PropertyCard({
  property,
  isFavorite,
  isComparing,
  onToggleFavorite,
  onToggleCompare,
  onQuickView
}: PropertyCardProps) {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // In real case, we can have supplementary images. Here we generate some alternative angles from Unsplash if index !== 0
  const images = [
    property.imageUrl,
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=600"
  ];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      id={`card-${property.id}`}
      className="glass-card rounded-2xl overflow-hidden group hover:shadow-cyan-500/10 hover:shadow-xl hover:border-teal-500/30 transition-all duration-300 relative flex flex-col h-full"
    >
      
      {/* 1. Header Media Visual Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
        
        {/* Interactive Video Play over Hover */}
        {isPlayingVideo && property.videoUrl ? (
          <video
            src={property.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-opacity duration-300"
            onMouseLeave={() => setIsPlayingVideo(false)}
          />
        ) : (
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500"
            onMouseEnter={() => property.videoUrl && setIsPlayingVideo(true)}
          />
        )}

        {/* Floating Gradients & Glass overlays on top of media */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/0 to-transparent opacity-80" />

        {/* RERA and Featured Ribbon Row */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
          
          <div className="flex gap-1.5">
            {property.featured && (
              <span className="text-[9px] uppercase tracking-wider bg-amber-500 font-bold text-slate-950 px-2 py-1 rounded-md shadow-md font-outfit">
                Featured Luxe
              </span>
            )}
            
            {property.rera && (
              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/95 font-bold text-slate-950 px-2 py-1 rounded-md shadow-md flex items-center gap-1 font-outfit">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                <span>RERA Cleared</span>
              </span>
            )}
          </div>

          <div className="flex gap-1">
            {/* Save/Favorite toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                isFavorite
                  ? "bg-rose-500 border-rose-600 text-white shadow-rose-500/20"
                  : "bg-black/40 hover:bg-black/60 border-white/10 text-gray-200 hover:text-white"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-white" : ""}`} />
            </button>
          </div>
        </div>

        {/* Video Tour Indicator */}
        {property.videoUrl && !isPlayingVideo && (
          <div className="absolute bottom-3 right-3 z-10 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] text-teal-300 flex items-center space-x-1 border border-white/5 pointer-events-none">
            <Video className="w-3 h-3 text-teal-400" />
            <span className="font-outfit font-medium">Virtual Walkthrough Available</span>
          </div>
        )}

        {/* Image Slider Dot Controllers */}
        <div className="absolute bottom-3 left-3 z-10 flex gap-1 items-center">
          <button
            onClick={handlePrevImage}
            className="w-4 h-4 rounded-full bg-black/60 hover:bg-teal-500 text-white flex items-center justify-center text-[10px] pb-0.5 font-bold"
          >
            ‹
          </button>
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                currentImageIndex === idx ? "bg-teal-400 w-3" : "bg-gray-400/50"
              }`}
            />
          ))}
          <button
            onClick={handleNextImage}
            className="w-4 h-4 rounded-full bg-black/60 hover:bg-teal-500 text-white flex items-center justify-center text-[10px] pb-0.5 font-bold"
          >
            ›
          </button>
        </div>
      </div>

      {/* 2. Textual content & specifications */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        
        <div className="space-y-2">
          {/* Tag Category and type label */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-teal-400 font-outfit font-semibold">
              {property.type} • {property.category === "Rent" ? "Private Lease" : property.category}
            </span>
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider flex items-center space-x-1">
              <Compass className="w-2.5 h-2.5 text-sky-400" />
              <span>{property.state} Corridor</span>
            </span>
          </div>

          {/* Title and location */}
          <h4 className="font-display font-medium text-base text-white group-hover:text-teal-300 transition-colors line-clamp-1">
            {property.title}
          </h4>

          <div className="flex items-center space-x-1 text-gray-400 text-xs">
            <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>

          {/* Property Stats Grid */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5 text-center mt-2">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-outfit">Beds BHK</p>
              <p className="text-xs font-semibold text-white">{property.beds || "Plot"}</p>
            </div>
            <div className="border-x border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-outfit">Baths</p>
              <p className="text-xs font-semibold text-white">{property.baths || "Plot"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-outfit">Built Area</p>
              <p className="text-xs font-semibold text-white">{property.sqft} sq.ft</p>
            </div>
          </div>
        </div>

        {/* 3. Bottom Prices & Call to Action Actions rows */}
        <div className="space-y-3 pt-3 mt-3">
          
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-outfit">Sovereign valuation</p>
              <p className="text-lg font-display font-bold text-teal-300">{property.price}</p>
            </div>
            
            {/* Compare Selector Checkbox inside Card */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 cursor-pointer transition-all ${
                isComparing
                  ? "bg-sky-500/15 border-sky-400/40 text-sky-300"
                  : "bg-slate-900 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              {isComparing ? <Check className="w-3 h-3 text-sky-400" /> : <Layers className="w-3 h-3" />}
              <span>Compare</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-1">
            
            {/* Action 1: View details */}
            <button
              onClick={onQuickView}
              className="px-2 py-2 bg-slate-900 border border-white/5 hover:border-teal-500/20 text-gray-200 rounded-xl text-xs flex items-center justify-center space-x-1 hover:bg-slate-900 cursor-pointer"
              title="Quick Specifications"
            >
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Inspect</span>
            </button>

            {/* Action 2: Direct call */}
            <a
              href="tel:+919999999999"
              className="px-2 py-2 bg-slate-900 border border-white/5 hover:border-emerald-500/20 text-gray-200 rounded-xl text-xs flex items-center justify-center space-x-1 hover:bg-slate-900"
              title="Call Representative"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Call GMM</span>
            </a>

            {/* Action 3: Inquire on WhatsApp */}
            <a
              href={`https://wa.me/919999999999?text=I%20am%20interested%20in%20inspecting%20${encodeURIComponent(property.title)}%20at%20${encodeURIComponent(property.location)}.%20Reference%20Code:%20${property.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-300 rounded-xl text-xs flex items-center justify-center space-x-1"
              title="Inquire over WhatsApp"
            >
              <span className="font-semibold text-[10px]">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
