'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, ArrowRight, Phone, ChevronRight, Zap, BarChart3, Trophy, Share2, Globe, Download, Video, Star, Menu, X } from 'lucide-react'
import SupportWidget from './SupportWidget'
import { setLangCookie } from '@/app/actions/lang'

// в”Ђв”Ђв”Ђ Types в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
type Lang = 'ru' | 'kz' | 'en'

// в”Ђв”Ђв”Ђ Translations в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const T = {
  ru: {
    label: 'RU',
    nav: { features: 'Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё', pricing: 'РўР°СЂРёС„С‹', contact: 'РљРѕРЅС‚Р°РєС‚С‹', login: 'Р’РѕР№С‚Рё', start: 'РќР°С‡Р°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ', dashboard: 'РњРѕРё С‚СѓСЂРЅРёСЂС‹' },
    hero: {
      badge: 'Р”Р»СЏ РѕСЂРіР°РЅРёР·Р°С‚РѕСЂРѕРІ Р»РёРі Рё С‚СѓСЂРЅРёСЂРѕРІ',
      h1: ['РЎС‡С‘С‚ Сѓ РІСЃРµС… вЂ” РѕРЅР»Р°Р№РЅ.', 'РЎС‚Р°С‚РёСЃС‚РёРєР° СЃС‡РёС‚Р°РµС‚СЃСЏ СЃР°РјР°.', 'РўСѓСЂРЅРёСЂ вЂ” РјРµРЅСЊС€Рµ 1 РјРёРЅСѓС‚С‹.'],
      sub: 'РЎРѕР·РґР°Р№С‚Рµ СЂР°СЃРїРёСЃР°РЅРёРµ, РїРѕРґРµР»РёС‚РµСЃСЊ СЃСЃС‹Р»РєРѕР№ вЂ” Рё Р¶РёРІР°СЏ СЃС‚СЂР°РЅРёС†Р° РІР°С€РµРіРѕ С‚СѓСЂРЅРёСЂР° СѓР¶Рµ Сѓ РєР°Р¶РґРѕРіРѕ СѓС‡Р°СЃС‚РЅРёРєР°. Р“РѕР»С‹, С‚Р°Р±Р»РёС†Р°, РїР»РµР№-РѕС„С„ Рё Р±РѕРјР±Р°СЂРґРёСЂС‹ СЃС‡РёС‚Р°СЋС‚СЃСЏ СЃР°РјРё. Р’С‹ РїСЂРѕСЃС‚Рѕ РІРµРґС‘С‚Рµ РёРіСЂСѓ.',
      cta: 'РЎРѕР·РґР°С‚СЊ С‚СѓСЂРЅРёСЂ Р±РµСЃРїР»Р°С‚РЅРѕ', cta2: 'РљР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚',
      proof: [['1 С‚СѓСЂРЅРёСЂ Р±РµСЃРїР»Р°С‚РЅРѕ', 'РІСЃРµ С„СѓРЅРєС†РёРё РІРєР»СЋС‡РµРЅС‹'], ['Р“РѕС‚РѕРІРѕ', 'Р·Р° 2 РјРёРЅСѓС‚С‹'], ['Р–РёРІР°СЏ СЃСЃС‹Р»РєР°', 'Р±РµР· РїСЂРёР»РѕР¶РµРЅРёР№']],
    },
    live: {
      badge: 'Live-С‚Р°Р±Р»Рѕ',
      h2: ['Р–РёРІРѕР№ СЃС‡С‘С‚ вЂ”', 'РЅР° Р»СЋР±РѕРј СЌРєСЂР°РЅРµ.'],
      sub: 'Р—Р°РїСѓСЃС‚РёС‚Рµ Live-СЂРµР¶РёРј РґРѕ РјР°С‚С‡Р° вЂ” СЃС‡С‘С‚, РіРѕР»С‹ Рё РєР°СЂС‚РѕС‡РєРё РјРіРЅРѕРІРµРЅРЅРѕ РїРѕСЏРІР»СЏСЋС‚СЃСЏ РЅР° СЌРєСЂР°РЅРµ Сѓ РєР°Р¶РґРѕРіРѕ Р·СЂРёС‚РµР»СЏ. РџСЂРѕРµС†РёСЂСѓР№С‚Рµ РЅР° С‚РµР»РµРІРёР·РѕСЂ РёР»Рё Р±РѕР»СЊС€РѕР№ СЌРєСЂР°РЅ. Р‘РµР· РїСЂРёР»РѕР¶РµРЅРёР№, Р±РµР· СЂРµРіРёСЃС‚СЂР°С†РёРё, Р±РµР· Р·Р°РґРµСЂР¶РєРё.',
      items: [
        'РўР°Р№РјРµСЂ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё вЂ” РЅР°РєРѕРїР»РµРЅРЅРѕРµ РІСЂРµРјСЏ, РїР°СѓР·Р°, РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРµ',
        'Р“РѕР»С‹ Рё Р°СЃСЃРёСЃС‚С‹ РјРіРЅРѕРІРµРЅРЅРѕ РїРѕСЏРІР»СЏСЋС‚СЃСЏ Сѓ РІСЃРµС… Р·СЂРёС‚РµР»РµР№',
        'РџРѕР»РЅРѕСЌРєСЂР°РЅРЅС‹Р№ СЂРµР¶РёРј вЂ” РїСЂРѕРµС†РёСЂСѓР№С‚Рµ РЅР° С‚РµР»РµРІРёР·РѕСЂ РёР»Рё LED-СЌРєСЂР°РЅ',
        'Р”РѕСЃС‚Р°С‚РѕС‡РЅРѕ РѕРґРЅРѕР№ СЃСЃС‹Р»РєРё вЂ” РєРѕРјР°РЅРґС‹ Рё Р±РѕР»РµР»СЊС‰РёРєРё СЃР»РµРґСЏС‚ Р±РµР· СЂРµРіРёСЃС‚СЂР°С†РёРё',
      ],
    },
    stats: {
      h2: ['РљРѕРЅРµС† СЂСѓС‡РЅРѕРјСѓ СЃС‡С‘С‚Сѓ.', 'Р’СЃС‘ СЃС‡РёС‚Р°РµС‚СЃСЏ СЃР°РјРѕ.'],
      sub: 'РџРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р° вЂ” Р±РѕРјР±Р°СЂРґРёСЂС‹, СЂР°Р·РЅРёС†Р° РјСЏС‡РµР№, РґРёСЃС†РёРїР»РёРЅР° РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ РјРіРЅРѕРІРµРЅРЅРѕ. РќРѕР»СЊ СЂСѓС‡РЅРѕРіРѕ С‚СЂСѓРґР°.',
      items: [
        'Р–РёРІР°СЏ С‚Р°Р±Р»РёС†Р° Р±РѕРјР±Р°СЂРґРёСЂРѕРІ Рё Р°СЃСЃРёСЃС‚РµРЅС‚РѕРІ',
        'РљР°СЂС‚РѕС‡РєРё Рё РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёСЏ РїРѕ РєР°Р¶РґРѕР№ РєРѕРјР°РЅРґРµ',
        'РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ СЂР°СЃС‡С‘С‚ РѕС‡РєРѕРІ Рё СЂР°Р·РЅРёС†С‹ РјСЏС‡РµР№',
        'Р­РєСЃРїРѕСЂС‚ РёС‚РѕРіРѕРІ РІ PDF вЂ” РґР»СЏ РїРµС‡Р°С‚Рё, С‡Р°С‚Р° РёР»Рё СЃРѕС†СЃРµС‚РµР№',
      ],
    },
    features: {
      tag: 'Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё',
      h2: 'Р’СЃС‘ РґР»СЏ С‚СѓСЂРЅРёСЂР°.\nРЈР¶Рµ РІРЅСѓС‚СЂРё.',
      sub: 'РўРѕ, С‡С‚Рѕ СЂР°РЅСЊС€Рµ Р·Р°РЅРёРјР°Р»Рѕ РІРµС‡РµСЂ вЂ” С‚РµРїРµСЂСЊ Р·Р°РЅРёРјР°РµС‚ РјРёРЅСѓС‚Сѓ.',
      items: [
        { title: 'Р Р°СЃРїРёСЃР°РЅРёРµ вЂ” РјРµРЅСЊС€Рµ 1 РјРёРЅСѓС‚С‹', desc: 'Р’С‹Р±РµСЂРёС‚Рµ С„РѕСЂРјР°С‚, РґРѕР±Р°РІСЊС‚Рµ РєРѕРјР°РЅРґС‹ вЂ” РІСЃРµ РјР°С‚С‡Рё РіРѕС‚РѕРІС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё. РљСЂСѓРіРѕРІРѕР№, РїР»РµР№-РѕС„С„, РіСЂСѓРїРїРѕРІРѕР№ СЌС‚Р°Рї, Р»РёРіР° СЃ РїР»РµР№-РѕС„С„РѕРј.' },
        { title: 'Р–РёРІРѕР№ СЃС‡С‘С‚ Р±РµР· РїСЂРёР»РѕР¶РµРЅРёР№', desc: 'Р“РѕР»С‹ СЃ С‚РµР»РµС„РѕРЅР° вЂ” СЃС‡С‘С‚ Сѓ РІСЃРµС… РјРіРЅРѕРІРµРЅРЅРѕ. Р‘РѕР»СЊС€Рµ РЅРёРєС‚Рѕ РЅРµ Р¶РґС‘С‚ СЃРєСЂРёРЅ РёР· WhatsApp. РџСЂРѕСЃС‚Рѕ СЃСЃС‹Р»РєР°.' },
        { title: 'РЎС‚Р°С‚РёСЃС‚РёРєР°, РєРѕС‚РѕСЂР°СЏ РЅРµ Р¶РґС‘С‚', desc: 'РћС‡РєРё, СЂР°Р·РЅРёС†Р° РјСЏС‡РµР№, Р±РѕРјР±Р°СЂРґРёСЂС‹ вЂ” РѕР±РЅРѕРІР»СЏСЋС‚СЃСЏ СЃР°РјРё РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ РјР°С‚С‡Р°. Р’СЃРµРіРґР° С‚РѕС‡РЅРѕ, РІСЃРµРіРґР° РІРѕРІСЂРµРјСЏ.' },
        { title: 'РџР»РµР№-РѕС„С„ Р±РµР· РіРѕР»РѕРІРЅРѕР№ Р±РѕР»Рё', desc: 'РџРѕР±РµРґРёС‚РµР»Рё РїРµСЂРµС…РѕРґСЏС‚ РґР°Р»СЊС€Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё. Р”Рѕ 64 РєРѕРјР°РЅРґ вЂ” РѕС‚ 1/8 РґРѕ С„РёРЅР°Р»Р°.' },
        { title: 'Р–РёРІР°СЏ СЃС‚СЂР°РЅРёС†Р° С‚СѓСЂРЅРёСЂР°', desc: 'РљР°Р¶РґС‹Р№ С‚СѓСЂРЅРёСЂ РїРѕР»СѓС‡Р°РµС‚ РїСѓР±Р»РёС‡РЅС‹Р№ URL. РџРѕРґРµР»РёС‚РµСЃСЊ СЃ РєРѕРјР°РЅРґР°РјРё РґРѕ РёРіСЂС‹ вЂ” РІСЃРµ СЃР»РµРґСЏС‚ Р·Р° С‚Р°Р±Р»РёС†РµР№ Рё СЃС‡С‘С‚РѕРј РѕРЅР»Р°Р№РЅ Р±РµР· СЂРµРіРёСЃС‚СЂР°С†РёРё.' },
        { title: 'Р‘СЂРµРЅРґРёСЂРѕРІР°РЅРЅС‹Рµ РѕС‚С‡С‘С‚С‹ РІ РѕРґРёРЅ РєР»РёРє', desc: 'РўР°Р±Р»РёС†Р°, СЃРµС‚РєР°, СЃС‚Р°С‚РёСЃС‚РёРєР° вЂ” РіРѕС‚РѕРІС‹ РґР»СЏ РїРµС‡Р°С‚Рё, СЃРѕС†СЃРµС‚РµР№ РёР»Рё С‡Р°С‚Р°. РљСЂР°СЃРёРІРѕ СЃ РїРµСЂРІРѕРіРѕ СЂР°Р·Р°.' },
      ],
      sportsLabel: 'Р Р°Р±РѕС‚Р°РµС‚ РґР»СЏ Р»СЋР±РѕРіРѕ РєРѕРјР°РЅРґРЅРѕРіРѕ СЃРїРѕСЂС‚Р°',
      sports: ['Р¤СѓС‚Р±РѕР»', 'РњРёРЅРё-С„СѓС‚Р±РѕР»', 'Р‘Р°СЃРєРµС‚Р±РѕР»', 'Р’РѕР»РµР№Р±РѕР»', 'РҐРѕРєРєРµР№', 'РўРµРЅРЅРёСЃ', 'РќР°СЃС‚РѕР»СЊРЅС‹Р№ С‚РµРЅРЅРёСЃ', 'Р‘Р°РґРјРёРЅС‚РѕРЅ'],
    },
    pricing: {
      h2: 'Р’С‹Р±РµСЂРёС‚Рµ СЃРІРѕР№ С„РѕСЂРјР°С‚.',
      sub: 'РќР°С‡РЅРёС‚Рµ Р±РµСЃРїР»Р°С‚РЅРѕ. РњР°СЃС€С‚Р°Р±РёСЂСѓР№С‚РµСЃСЊ Р±РµР· РѕРіСЂР°РЅРёС‡РµРЅРёР№.',
      tabs: { monthly: 'Р•Р¶РµРјРµСЃСЏС‡РЅРѕ', annual: 'Р•Р¶РµРіРѕРґРЅРѕ' },
      annualBadge: 'в€’25%',
      groupLabels: { pro: 'РћС‚РєСЂС‹РІР°РµС‚СЃСЏ РІ PRO', enterprise: 'РўРѕР»СЊРєРѕ РІ Enterprise' },
      features: [
        { label: 'Р’СЃРµ С„РѕСЂРјР°С‚С‹ С‚СѓСЂРЅРёСЂРѕРІ', free: true, pro: true, enterprise: true },
        { label: 'РђРІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅРЅР°СЏ СЃС‚Р°С‚РёСЃС‚РёРєР°', free: true, pro: true, enterprise: true },
        { label: 'РџСѓР±Р»РёС‡РЅР°СЏ СЃС‚СЂР°РЅРёС†Р° С‚СѓСЂРЅРёСЂР°', free: true, pro: true, enterprise: true },
        { label: 'РћС‚С‡С‘С‚С‹ РІ PDF Рё PNG', free: true, pro: true, enterprise: true },
        { label: 'LIVE-СЂРµР¶РёРј СЃ С‚Р°Р±Р»Рѕ', free: true, pro: true, enterprise: true },
        { label: 'РќРµРѕРіСЂР°РЅРёС‡РµРЅРЅРѕРµ РєРѕР»РёС‡РµСЃС‚РІРѕ С‚СѓСЂРЅРёСЂРѕРІ Рё РєРѕРјР°РЅРґ', free: false, pro: true, enterprise: true },
        { label: 'Р‘СЂРµРЅРґРёСЂРѕРІР°РЅРЅС‹Рµ РѕС‚С‡С‘С‚С‹', free: false, pro: true, enterprise: true },
        { label: 'Р”РѕР±Р°РІР»РµРЅРёРµ СЃРѕСЂРµРґР°РєС‚РѕСЂРѕРІ', free: false, pro: true, enterprise: true },
        { label: 'РџСЂРёРѕСЂРёС‚РµС‚РЅР°СЏ РїРѕРґРґРµСЂР¶РєР°', free: false, pro: true, enterprise: true },
        { label: 'РџРѕСЃС‚РѕСЏРЅРЅС‹Рµ Р»РёРіРё СЃ СЃРµР·РѕРЅР°РјРё', free: false, pro: false, enterprise: true },
        { label: 'РЈРіР»СѓР±Р»С‘РЅРЅР°СЏ СЃС‚Р°С‚РёСЃС‚РёРєР° Рё Р°РЅР°Р»РёС‚РёРєР°', free: false, pro: false, enterprise: true },
        { label: 'РџСЂРѕС„РёР»Рё РєРѕРјР°РЅРґ Рё РёРіСЂРѕРєРѕРІ', free: false, pro: false, enterprise: true },
        { label: 'РЎРѕСЃС‚Р°РІС‹ Рє РјР°С‚С‡Р°Рј', free: false, pro: false, enterprise: true },
        { label: 'Р”РѕСЃС‚СѓРїРЅРѕСЃС‚СЊ РІ РїРѕРёСЃРєРѕРІС‹С… СЃРёСЃС‚РµРјР°С…', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'РЎС‚Р°СЂС‚',
        priceMonthly: '0 в‚ё',
        limit: '1 С‚СѓСЂРЅРёСЂ В· РґРѕ 16 РєРѕРјР°РЅРґ',
        cta: 'РќР°С‡Р°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ',
      },
      pro: {
        name: 'PRO', badge: 'Р’С‹Р±РѕСЂ РѕСЂРіР°РЅРёР·Р°С‚РѕСЂРѕРІ',
        priceMonthly: '4 990 в‚ё', perMonthly: '/ РјРµСЃ',
        priceAnnual: '44 990 в‚ё', perAnnual: '/ РіРѕРґ',
        priceOriginalAnnual: 'Р’РјРµСЃС‚Рѕ 59 880 в‚ё', savingAnnual: 'Р­РєРѕРЅРѕРјРёСЏ 14 890 в‚ё',
        cta: 'РџРµСЂРµР№С‚Рё РЅР° PRO',
      },
      enterprise: {
        name: 'Enterprise', badge: 'Р”Р»СЏ С„РµРґРµСЂР°С†РёР№ Рё Р»РёРі', sub: 'РџРѕР»РЅС‹Р№ С„СѓРЅРєС†РёРѕРЅР°Р» РїР»Р°С‚С„РѕСЂРјС‹',
        priceMonthly: 'РѕС‚ 39 990 в‚ё', perMonthly: '/ РјРµСЃ',
        priceAnnual: '349 990 в‚ё', perAnnual: '/ РіРѕРґ',
        priceOriginalAnnual: 'Р’РјРµСЃС‚Рѕ 479 880 в‚ё', savingAnnual: 'Р­РєРѕРЅРѕРјРёСЏ 129 890 в‚ё',
        cta: 'РџРѕРґРєР»СЋС‡РёС‚СЊ Enterprise',
      },
    },
    services: {
      h2: 'РњС‹ Р±РµСЂС‘Рј РЅР° СЃРµР±СЏ РІСЃС‘',
      sub: 'РҐРѕС‚РёС‚Рµ РїРѕР»РЅРѕСЃС‚СЊСЋ РґРµР»РµРіРёСЂРѕРІР°С‚СЊ? РќР°С€Рё СЃРїРµС†РёР°Р»РёСЃС‚С‹ РІС‹РµРґСѓС‚ Рє РІР°Рј Рё РІРѕР·СЊРјСѓС‚ С‚РµС…РЅРёРєСѓ РІ СЃРІРѕРё СЂСѓРєРё.',
      items: [
        { icon: 'video', title: 'РџСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅР°СЏ РІРёРґРµРѕСЃСЉС‘РјРєР°', desc: 'РќР°С€Р° РєРѕРјР°РЅРґР° РїСЂРёРµРґРµС‚ РЅР° С‚СѓСЂРЅРёСЂ Рё РїСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅРѕ СЃРЅРёРјРµС‚ РєР°Р¶РґС‹Р№ РјР°С‚С‡. Р’РёРґРµРѕР·Р°РїРёСЃРё РїРѕСЏРІСЏС‚СЃСЏ РІ РІР°С€РµРј Р°РєРєР°СѓРЅС‚Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.', price: null, pricePer: null, badge: 'РЎРєРѕСЂРѕ', badgeColor: 'blue' },
        { icon: 'trophy', title: 'РћРїРµСЂР°С‚РѕСЂ РЅР° С‚СѓСЂРЅРёСЂ', desc: 'РќР°С€ СЃРїРµС†РёР°Р»РёСЃС‚ РїСЂРёРµРґРµС‚ Рё РІРѕР·СЊРјС‘С‚ РЅР° СЃРµР±СЏ РІСЃРµ СЂРµР·СѓР»СЊС‚Р°С‚С‹ вЂ” РІРІРѕРґРёС‚ РјР°С‚С‡Рё РїСЂСЏРјРѕ РІ РїР»Р°С‚С„РѕСЂРјСѓ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё. Р’С‹ РІРµРґС‘С‚Рµ РёРіСЂСѓ вЂ” РјС‹ Р·Р° СЌРєСЂР°РЅРѕРј.', price: '19 990 в‚ё', pricePer: 'РІ РґРµРЅСЊ', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'Р•СЃС‚СЊ РІРѕРїСЂРѕСЃ? РџРёС€РёС‚Рµ.', sub: 'РћС‚РІРµС‡Р°РµРј Р±С‹СЃС‚СЂРѕ. Р–РёРІС‹Рµ Р»СЋРґРё, РЅРµ Р±РѕС‚С‹.', wa: 'РќР°РїРёСЃР°С‚СЊ РІ WhatsApp', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'Р’Р°С€ СЃР»РµРґСѓСЋС‰РёР№ С‚СѓСЂРЅРёСЂ вЂ” СѓР¶Рµ СЃРµРіРѕРґРЅСЏ.', sub: 'РњРёРЅСѓС‚Р° РЅР° СЂРµРіРёСЃС‚СЂР°С†РёСЋ. РўСѓСЂРЅРёСЂ РіРѕС‚РѕРІ. РЈС‡Р°СЃС‚РЅРёРєРё РІ С€РѕРєРµ РѕС‚ СѓСЂРѕРІРЅСЏ.', btn: 'РќР°С‡Р°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ' },
    footer: {
      tagline: 'РЎРѕР·РґР°Р№С‚Рµ РїРµСЂРІС‹Р№ С‚СѓСЂРЅРёСЂ РјРµРЅСЊС€Рµ 1 РјРёРЅСѓС‚С‹. РЎС‚Р°С‚РёСЃС‚РёРєР°, Live-С‚Р°Р±Р»Рѕ Рё РїР»РµР№-РѕС„С„ вЂ” РІСЃС‘ СЃС‡РёС‚Р°РµС‚СЃСЏ СЃР°РјРѕ.',
      cols: { product: 'РџСЂРѕРґСѓРєС‚', platform: 'РџР»Р°С‚С„РѕСЂРјР°', connect: 'РЎРІСЏР·СЊ' },
      links: { features: 'Р’РѕР·РјРѕР¶РЅРѕСЃС‚Рё', pricing: 'РўР°СЂРёС„С‹', contact: 'РљРѕРЅС‚Р°РєС‚С‹', login: 'Р’РѕР№С‚Рё', register: 'Р РµРіРёСЃС‚СЂР°С†РёСЏ', pro: 'РўР°СЂРёС„ PRO' },
      legal: 'В© 2026 Tournable. Р’СЃРµ РїСЂР°РІР° Р·Р°С‰РёС‰РµРЅС‹.',
      privacy: 'РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё', terms: 'РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ',
    },
  },

  kz: {
    label: 'KZ',
    nav: { features: 'РњТЇРјРєС–РЅРґС–РєС‚РµСЂ', pricing: 'РўР°СЂРёС„С‚РµСЂ', contact: 'Р‘Р°Р№Р»Р°РЅС‹СЃ', login: 'РљС–СЂСѓ', start: 'РўРµРіС–РЅ Р±Р°СЃС‚Р°Сѓ', dashboard: 'РњРµРЅС–ТЈ С‚СѓСЂРЅРёСЂР»Р°СЂС‹Рј' },
    hero: {
      badge: 'Р›РёРіР°Р»Р°СЂ РјРµРЅ С‚СѓСЂРЅРёСЂР»РµСЂ Т±Р№С‹РјРґР°СЃС‚С‹СЂСѓС€С‹Р»Р°СЂС‹РЅР°',
      h1: ['Р•СЃРµРї Р±Р°СЂР»С‹Т“С‹РЅРґР° вЂ” РѕРЅР»Р°Р№РЅ.', 'РЎС‚Р°С‚РёСЃС‚РёРєР° У©Р·РґС–РіС–РЅРµРЅ РµСЃРµРїС‚РµР»РµРґС–.', 'РўСѓСЂРЅРёСЂ вЂ” 1 РјРёРЅСѓС‚С‚Р°РЅ Р°Р·.'],
      sub: 'РљРµСЃС‚Рµ Р¶Р°СЃР°ТЈС‹Р·, СЃС–Р»С‚РµРјРµРјРµРЅ Р±У©Р»С–СЃС–ТЈС–Р· вЂ” Р¶У™РЅРµ С‚СѓСЂРЅРёСЂС–ТЈС–Р·РґС–ТЈ С‚С–СЂС– Р±РµС‚С– У™СЂР±С–СЂ Т›Р°С‚С‹СЃСѓС€С‹РґР°. Р“РѕР»РґР°СЂ, РєРµСЃС‚Рµ, РїР»РµР№-РѕС„С„ Р¶У™РЅРµ Р±РѕРјР±Р°СЂРґРёСЂР»РµСЂ У©Р·РґС–РіС–РЅРµРЅ РµСЃРµРїС‚РµР»РµРґС–. РЎС–Р· С‚РµРє С‚СѓСЂРЅРёСЂРґС– У©С‚РєС–Р·РµСЃС–Р·.',
      cta: 'РўСѓСЂРЅРёСЂРґС– С‚РµРіС–РЅ Р¶Р°СЃР°Сѓ', cta2: 'ТљР°Р»Р°Р№ Р¶Т±РјС‹СЃ С–СЃС‚РµР№РґС–',
      proof: [['1 С‚СѓСЂРЅРёСЂ С‚РµРіС–РЅ', 'Р±Р°СЂР»С‹Т› РјТЇРјРєС–РЅРґС–РєС‚РµСЂ'], ['Р”Р°Р№С‹РЅ', '2 РјРёРЅСѓС‚С‚Р°'], ['РўС–СЂС– СЃС–Р»С‚РµРјРµ', 'Т›РѕСЃС‹РјС€Р°СЃС‹Р·']],
    },
    live: {
      badge: 'Live-С‚Р°Т›С‚Р°',
      h2: ['РўС–СЂС– РµСЃРµРї вЂ”', 'РєРµР· РєРµР»РіРµРЅ СЌРєСЂР°РЅРґР°.'],
      sub: 'Live-СЂРµР¶РёРјРґС– РјР°С‚С‡Т›Р° РґРµР№С–РЅ С–СЃРєРµ Т›РѕСЃС‹ТЈС‹Р· вЂ” РµСЃРµРї, РіРѕР»РґР°СЂ РјРµРЅ РєР°СЂС‚РѕС‡РєР°Р»Р°СЂ Р±Р°СЂР»С‹Т› С‚Р°РјР°С€Р°Р»Р°СѓС€С‹Р»Р°СЂРґС‹ТЈ СЌРєСЂР°РЅС‹РЅРґР° Р»РµР·РґРµ РїР°Р№РґР° Р±РѕР»Р°РґС‹. РўРµР»РµРґРёРґР°СЂТ“Р° РЅРµРјРµСЃРµ СЌРєСЂР°РЅТ“Р° РїСЂРѕРµРєС†РёСЏР»Р°ТЈС‹Р·. ТљРѕСЃС‹РјС€Р°СЃС‹Р·, С‚С–СЂРєРµР»СѓСЃС–Р·, РєРµС€С–РєС‚С–СЂСѓСЃС–Р·.',
      items: [
        'РќР°Т›С‚С‹ СѓР°Т›С‹С‚С‚Р° С‚Р°Р№РјРµСЂ вЂ” Р¶РёРЅР°Т›С‚Р°Р»Т“Р°РЅ СѓР°Т›С‹С‚, ТЇР·С–Р»С–СЃ, Т›РѕСЃС‹РјС€Р° СѓР°Т›С‹С‚',
        'Р“РѕР»РґР°СЂ РјРµРЅ Р°СЃСЃРёСЃС‚С‚РµСЂ Р±Р°СЂР»С‹Т› С‚Р°РјР°С€Р°Р»Р°СѓС€С‹Р»Р°СЂТ“Р° Р»РµР·РґРµ Р¶РµС‚РµРґС–',
        'РўРѕР»С‹Т› СЌРєСЂР°РЅ СЂРµР¶РёРјС– вЂ” С‚РµР»РµРґРёРґР°СЂРґР° РЅРµРјРµСЃРµ LED-СЌРєСЂР°РЅРґР° РїСЂРѕРµРєС†РёСЏР»Р°ТЈС‹Р·',
        'Р‘С–СЂ СЃС–Р»С‚РµРјРµ Р¶РµС‚РєС–Р»С–РєС‚С– вЂ” С‚С–СЂРєРµР»РјРµР№ Т›Р°СЂР°Р№ Р°Р»Р°РґС‹',
      ],
    },
    stats: {
      h2: ['ТљРѕР»РјРµРЅ РµСЃРµРїС‚РµСѓ Р°СЂС‚С‚Р° Т›Р°Р»РґС‹.', 'Р‘У™СЂС– У©Р·РґС–РіС–РЅРµРЅ РµСЃРµРїС‚РµР»РµРґС–.'],
      sub: 'УСЂ РЅУ™С‚РёР¶Рµ РµРЅРіС–Р·С–Р»РіРµРЅРЅРµРЅ РєРµР№С–РЅ вЂ” Р±РѕРјР±Р°СЂРґРёСЂР»РµСЂ, РґРѕРї Р°Р№С‹СЂРјР°СЃС‹, С‚У™СЂС‚С–Рї Р»РµР·РґРµ Р¶Р°ТЈР°СЂР°РґС‹. Р•С€Т›Р°РЅРґР°Р№ Т›РѕР»РјРµРЅ РµСЃРµРїС‚РµСѓ Р¶РѕТ›.',
      items: [
        'Р‘РѕРјР±Р°СЂРґРёСЂР»РµСЂ РјРµРЅ Р°СЃСЃРёСЃС‚С‚РµСЂРґС–ТЈ С‚С–СЂС– РєРµСЃС‚РµСЃС–',
        'РљР°СЂС‚РѕС‡РєР°Р»Р°СЂ РјРµРЅ РµСЃРєРµСЂС‚СѓР»РµСЂ вЂ” У™СЂ РєРѕРјР°РЅРґР° Р±РѕР№С‹РЅС€Р°',
        'Т°РїР°Р№Р»Р°СЂ РјРµРЅ РґРѕРї Р°Р№С‹СЂРјР°СЃС‹РЅ Р°РІС‚РѕРјР°С‚С‚С‹ РµСЃРµРїС‚РµСѓ',
        'ТљРѕСЂС‹С‚С‹РЅРґС‹РЅС‹ PDF-РєРµ СЌРєСЃРїРѕСЂС‚С‚Р°Сѓ вЂ” Р±Р°СЃС‹Рї С€С‹Т“Р°СЂСѓТ“Р°, С‡Р°С‚Т›Р° РЅРµРјРµСЃРµ У™Р»РµСѓРјРµС‚С‚С–Рє Р¶РµР»С–Р»РµСЂРіРµ',
      ],
    },
    features: {
      tag: 'РњТЇРјРєС–РЅРґС–РєС‚РµСЂ',
      h2: 'РўСѓСЂРЅРёСЂ ТЇС€С–РЅ Р±У™СЂС–.\nР”Р°Р№С‹РЅ РєТЇР№РґРµ.',
      sub: 'Р‘Т±СЂС‹РЅ РєРµС€РєРµ Р°Р»Р°С‚С‹РЅ РЅУ™СЂСЃРµ вЂ” РµРЅРґС– Р±С–СЂ РјРёРЅСѓС‚С‚Р°.',
      items: [
        { title: 'РљРµСЃС‚Рµ вЂ” 1 РјРёРЅСѓС‚С‚Р°РЅ Р°Р·', desc: 'Р¤РѕСЂРјР°С‚С‚С‹ С‚Р°ТЈРґР°ТЈС‹Р·, РєРѕРјР°РЅРґР°Р»Р°СЂРґС‹ Т›РѕСЃС‹ТЈС‹Р· вЂ” Р±Р°СЂР»С‹Т› РјР°С‚С‡С‚Р°СЂ Р°РІС‚РѕРјР°С‚С‚С‹ РґР°Р№С‹РЅ. Р”У©ТЈРіРµР»РµРє, РїР»РµР№-РѕС„С„, С‚РѕРїС‚С‹Т› РєРµР·РµТЈ, Р»РёРіР° + РїР»РµР№-РѕС„С„.' },
        { title: 'ТљРѕСЃС‹РјС€Р°СЃС‹Р· С‚С–СЂС– РµСЃРµРї', desc: 'РўРµР»РµС„РѕРЅРЅР°РЅ РіРѕР»РґР°СЂ вЂ” РµСЃРµРї Р±Р°СЂР»С‹Т“С‹РЅР° Р»РµР·РґРµ. Р•С€РєС–Рј WhatsApp СЃРєСЂРёРЅС€РѕС‚С‹РЅ РєТЇС‚РїРµР№РґС–. РўРµРє СЃС–Р»С‚РµРјРµ.' },
        { title: 'Р–Р°ТЈР°СЂС‹Рї С‚Т±СЂР°С‚С‹РЅ СЃС‚Р°С‚РёСЃС‚РёРєР°', desc: 'Т°РїР°Р№Р»Р°СЂ, РґРѕРї Р°Р№С‹СЂРјР°СЃС‹, Р±РѕРјР±Р°СЂРґРёСЂР»РµСЂ вЂ” У™СЂ РјР°С‚С‡С‚Р°РЅ РєРµР№С–РЅ У©Р·РґС–РіС–РЅРµРЅ Р¶Р°ТЈР°СЂР°РґС‹. УСЂТ›Р°С€Р°РЅ РґУ™Р», У™СЂТ›Р°С€Р°РЅ СѓР°Т›С‹С‚С‹РЅРґР°.' },
        { title: 'Р‘Р°СЃ Р°СѓС‹СЂС‚РїР°Р№С‚С‹РЅ РїР»РµР№-РѕС„С„', desc: 'Р–РµТЈС–РјРїР°Р·РґР°СЂ Р°РІС‚РѕРјР°С‚С‚С‹ Р°Р»Т“Р° У©С‚РµРґС–. 64 РєРѕРјР°РЅРґР°Т“Р° РґРµР№С–РЅ вЂ” 1/8-РґРµРЅ С„РёРЅР°Р»Т“Р°.' },
        { title: 'РўСѓСЂРЅРёСЂРґС–ТЈ С‚С–СЂС– Р±РµС‚С–', desc: 'УСЂР±С–СЂ С‚СѓСЂРЅРёСЂ Р¶Р°Р»РїС‹Т“Р° РѕСЂС‚Р°Т› URL Р°Р»Р°РґС‹. РњР°С‚С‡Т›Р° РґРµР№С–РЅ РєРѕРјР°РЅРґР°Р»Р°СЂТ“Р° СЃС–Р»С‚РµРјРµРЅС– Р¶С–Р±РµСЂС–ТЈС–Р· вЂ” Р±Р°СЂР»С‹Т“С‹ С‚С–СЂРєРµР»РјРµР№ РєРµСЃС‚РµРЅС– РѕРЅР»Р°Р№РЅ Т›Р°СЂР°Р№РґС‹.' },
        { title: 'Р‘СЂРµРЅРґС‚РµР»РіРµРЅ РµСЃРµРїС‚РµСЂ Р±С–СЂ С€РµСЂС‚СѓРјРµРЅ', desc: 'РљРµСЃС‚Рµ, С‚РѕСЂ, СЃС‚Р°С‚РёСЃС‚РёРєР° вЂ” Р±Р°СЃС‹Рї С€С‹Т“Р°СЂСѓТ“Р°, У™Р»РµСѓРјРµС‚С‚С–Рє Р¶РµР»С–Р»РµСЂРіРµ РЅРµРјРµСЃРµ С‡Р°С‚Т›Р° РґР°Р№С‹РЅ. Р‘С–СЂРґРµРЅ СЃТ±Р»Сѓ С€С‹Т“Р°РґС‹.' },
      ],
      sportsLabel: 'РљРµР· РєРµР»РіРµРЅ РєРѕРјР°РЅРґР°Р»С‹Т› СЃРїРѕСЂС‚ ТЇС€С–РЅ Р¶Т±РјС‹СЃ С–СЃС‚РµР№РґС–',
      sports: ['Р¤СѓС‚Р±РѕР»', 'РњРёРЅРё-С„СѓС‚Р±РѕР»', 'Р‘Р°СЃРєРµС‚Р±РѕР»', 'Р’РѕР»РµР№Р±РѕР»', 'РҐРѕРєРєРµР№', 'РўРµРЅРЅРёСЃ', 'Т®СЃС‚РµР» С‚РµРЅРёСЃС–', 'Р‘Р°РґРјРёРЅС‚РѕРЅ'],
    },
    pricing: {
      h2: 'УЁР· С„РѕСЂРјР°С‚С‹ТЈС‹Р·РґС‹ С‚Р°ТЈРґР°ТЈС‹Р·.',
      sub: 'РўРµРіС–РЅ Р±Р°СЃС‚Р°ТЈС‹Р·. РЁРµРєС‚РµСѓСЃС–Р· РјР°СЃС€С‚Р°Р±С‚Р°ТЈС‹Р·.',
      tabs: { monthly: 'РђР№ СЃР°Р№С‹РЅ', annual: 'Р–С‹Р» СЃР°Р№С‹РЅ' },
      annualBadge: 'в€’25%',
      groupLabels: { pro: 'PRO-РґР° Р°С€С‹Р»Р°РґС‹', enterprise: 'РўРµРє Enterprise-С‚Рµ' },
      features: [
        { label: 'Р‘Р°СЂР»С‹Т› С‚СѓСЂРЅРёСЂ С„РѕСЂРјР°С‚С‚Р°СЂС‹', free: true, pro: true, enterprise: true },
        { label: 'РђРІС‚РѕРјР°С‚С‚Р°РЅРґС‹СЂС‹Р»Т“Р°РЅ СЃС‚Р°С‚РёСЃС‚РёРєР°', free: true, pro: true, enterprise: true },
        { label: 'РўСѓСЂРЅРёСЂРґС–ТЈ Р¶Р°Р»РїС‹Т“Р° РѕСЂС‚Р°Т› Р±РµС‚С–', free: true, pro: true, enterprise: true },
        { label: 'PDF Р¶У™РЅРµ PNG РµСЃРµРїС‚РµСЂС–', free: true, pro: true, enterprise: true },
        { label: 'LIVE-СЂРµР¶РёРј С‚Р°Т›С‚Р°СЃС‹', free: true, pro: true, enterprise: true },
        { label: 'РўСѓСЂРЅРёСЂР»РµСЂ РјРµРЅ РєРѕРјР°РЅРґР°Р»Р°СЂ вЂ” С€РµРєСЃС–Р·', free: false, pro: true, enterprise: true },
        { label: 'Р‘СЂРµРЅРґС‚РµР»РіРµРЅ РµСЃРµРїС‚РµСЂ', free: false, pro: true, enterprise: true },
        { label: 'РЎРѕСЂРµРґР°РєС‚РѕСЂР»Р°СЂРґС‹ Т›РѕСЃСѓ', free: false, pro: true, enterprise: true },
        { label: 'Р‘Р°СЃС‹Рј Т›РѕР»РґР°Сѓ', free: false, pro: true, enterprise: true },
        { label: 'РњР°СѓСЃС‹РјРґР°СЂС‹ Р±Р°СЂ С‚Т±СЂР°Т›С‚С‹ Р»РёРіР°Р»Р°СЂ', free: false, pro: false, enterprise: true },
        { label: 'РўРµСЂРµТЈРґРµС‚С–Р»РіРµРЅ СЃС‚Р°С‚РёСЃС‚РёРєР° Р¶У™РЅРµ Р°РЅР°Р»РёС‚РёРєР°', free: false, pro: false, enterprise: true },
        { label: 'РљРѕРјР°РЅРґР° РјРµРЅ РѕР№С‹РЅС€С‹ РїСЂРѕС„РёР»СЊРґРµСЂС–', free: false, pro: false, enterprise: true },
        { label: 'РњР°С‚С‡Т›Р° Р°СЂРЅР°Р»Т“Р°РЅ Т›Т±СЂР°РјРґР°СЂ', free: false, pro: false, enterprise: true },
        { label: 'Р†Р·РґРµСѓ Р¶ТЇР№РµР»РµСЂС–РЅРґРµ Т›РѕР»Р¶РµС‚С–РјРґС–Р»С–Рє', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'РЎС‚Р°СЂС‚',
        priceMonthly: '0 в‚ё',
        limit: '1 С‚СѓСЂРЅРёСЂ В· 16 РєРѕРјР°РЅРґР°Т“Р° РґРµР№С–РЅ',
        cta: 'РўРµРіС–РЅ Р±Р°СЃС‚Р°Сѓ',
      },
      pro: {
        name: 'PRO', badge: 'Т°Р№С‹РјРґР°СЃС‚С‹СЂСѓС€С‹Р»Р°СЂРґС‹ТЈ С‚Р°ТЈРґР°СѓС‹',
        priceMonthly: '4 990 в‚ё', perMonthly: '/ Р°Р№',
        priceAnnual: '44 990 в‚ё', perAnnual: '/ Р¶С‹Р»',
        priceOriginalAnnual: 'РћСЂРЅС‹РЅР° 59 880 в‚ё', savingAnnual: '14 890 в‚ё ТЇРЅРµРјРґРµСѓ',
        cta: 'PRO-Т“Р° У©С‚Сѓ',
      },
      enterprise: {
        name: 'Enterprise', badge: 'Р¤РµРґРµСЂР°С†РёСЏР»Р°СЂ РјРµРЅ Р»РёРіР°Р»Р°СЂ ТЇС€С–РЅ', sub: 'РџР»Р°С‚С„РѕСЂРјР°РЅС‹ТЈ С‚РѕР»С‹Т› РјТЇРјРєС–РЅРґС–РєС‚РµСЂС–',
        priceMonthly: '39 990 в‚ё-РґР°РЅ', perMonthly: '/ Р°Р№',
        priceAnnual: '349 990 в‚ё', perAnnual: '/ Р¶С‹Р»',
        priceOriginalAnnual: 'РћСЂРЅС‹РЅР° 479 880 в‚ё', savingAnnual: '129 890 в‚ё ТЇРЅРµРјРґРµСѓ',
        cta: 'Enterprise-РєРµ Т›РѕСЃС‹Р»Сѓ',
      },
    },
    services: {
      h2: 'Р‘Р°СЂР»С‹Т“С‹РЅ Р±С–Р· Р°Р»Р°РјС‹Р·',
      sub: 'РўРѕР»С‹Т›С‚Р°Р№ С‚Р°РїСЃС‹СЂТ“С‹ТЈС‹Р· РєРµР»Рµ РјРµ? РњР°РјР°РЅРґР°СЂС‹РјС‹Р· СЃС–Р·РіРµ Р±Р°СЂС‹Рї, С‚РµС…РЅРёРєР°РЅС‹ У©Р· Т›РѕР»РґР°СЂС‹РЅР° Р°Р»Р°РґС‹.',
      items: [
        { icon: 'video', title: 'РљУ™СЃС–Р±Рё Р±РµР№РЅРµС‚ТЇСЃС–СЂСѓ', desc: 'РљРѕРјР°РЅРґР°РјС‹Р· С‚СѓСЂРЅРёСЂРіРµ РєРµР»С–Рї, Р°Р»Р°ТЈРґР°Т“С‹ У™СЂ РјР°С‚С‡С‚С‹ РєУ™СЃС–Р±Рё С‚ТЇСЂРґРµ С‚ТЇСЃС–СЂРµРґС–. Р‘РµР№РЅРµР¶Р°Р·Р±Р°Р»Р°СЂ Р°РєРєР°СѓРЅС‚С‹ТЈС‹Р·РґР° Р°РІС‚РѕРјР°С‚С‚С‹ РїР°Р№РґР° Р±РѕР»Р°РґС‹.', price: null, pricePer: null, badge: 'Р–Р°Т›С‹РЅРґР°', badgeColor: 'blue' },
        { icon: 'trophy', title: 'РўСѓСЂРЅРёСЂС–ТЈС–Р·РіРµ РѕРїРµСЂР°С‚РѕСЂ', desc: 'РњР°РјР°РЅС‹РјС‹Р· РєРµР»С–Рї, Р±Р°СЂР»С‹Т› РјР°С‚С‡ РЅУ™С‚РёР¶РµР»РµСЂС–РЅ С‚С–РєРµР»РµР№ РїР»Р°С‚С„РѕСЂРјР°Т“Р° РЅР°Т›С‚С‹ СѓР°Т›С‹С‚С‚Р° РµРЅРіС–Р·РµРґС–. РЎС–Р· РѕР№С‹РЅРґС‹ Р¶ТЇСЂРіС–Р·РµСЃС–Р· вЂ” Р±С–Р· СЌРєСЂР°РЅ Р°Р»РґС‹РЅРґР°РјС‹Р·.', price: '19 990 в‚ё', pricePer: 'РєТЇРЅС–РЅРµ', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'РЎТ±СЂР°Т“С‹ТЈС‹Р· Р±Р°СЂ РјР°? Р–Р°Р·С‹ТЈС‹Р·.', sub: 'Р–С‹Р»РґР°Рј Р¶Р°СѓР°Рї Р±РµСЂРµРјС–Р·. РўС–СЂС– Р°РґР°РјРґР°СЂ, СЂРѕР±РѕС‚С‚Р°СЂ РµРјРµСЃ.', wa: 'WhatsApp-Т›Р° Р¶Р°Р·Сѓ', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'РљРµР»РµСЃС– С‚СѓСЂРЅРёСЂС–ТЈС–Р· вЂ” Р±ТЇРіС–РЅ.', sub: 'РўС–СЂРєРµР»Сѓ вЂ” Р±С–СЂ РјРёРЅСѓС‚. РўСѓСЂРЅРёСЂ РґР°Р№С‹РЅ. ТљР°С‚С‹СЃСѓС€С‹Р»Р°СЂ РґРµТЈРіРµР№РґРµРЅ С‚Р°ТЈ Т›Р°Р»Р°РґС‹.', btn: 'РўРµРіС–РЅ Р±Р°СЃС‚Р°Сѓ' },
    footer: {
      tagline: 'РђР»Т“Р°С€Т›С‹ С‚СѓСЂРЅРёСЂРґС– 1 РјРёРЅСѓС‚С‚Р°РЅ Р°Р· СѓР°Т›С‹С‚С‚Р° Р¶Р°СЃР°ТЈС‹Р·. РЎС‚Р°С‚РёСЃС‚РёРєР°, Live-С‚Р°Т›С‚Р° Р¶У™РЅРµ РїР»РµР№-РѕС„С„ вЂ” Р±У™СЂС– Р°РІС‚РѕРјР°С‚С‚С‹.',
      cols: { product: 'УЁРЅС–Рј', platform: 'РџР»Р°С‚С„РѕСЂРјР°', connect: 'Р‘Р°Р№Р»Р°РЅС‹СЃ' },
      links: { features: 'РњТЇРјРєС–РЅРґС–РєС‚РµСЂ', pricing: 'РўР°СЂРёС„С‚РµСЂ', contact: 'Р‘Р°Р№Р»Р°РЅС‹СЃ', login: 'РљС–СЂСѓ', register: 'РўС–СЂРєРµР»Сѓ', pro: 'PRO С‚Р°СЂРёС„С–' },
      legal: 'В© 2026 Tournable. Р‘Р°СЂР»С‹Т› Т›Т±Т›С‹Т›С‚Р°СЂ Т›РѕСЂТ“Р°Р»Т“Р°РЅ.',
      privacy: 'ТљТ±РїРёСЏР»С‹Р»С‹Т› СЃР°СЏСЃР°С‚С‹', terms: 'РџР°Р№РґР°Р»Р°РЅСѓС€С‹ РєРµР»С–СЃС–РјС–',
    },
  },

  en: {
    label: 'EN',
    nav: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', start: 'Start Free', dashboard: 'My Tournaments' },
    hero: {
      badge: 'For league & tournament organisers',
      h1: ['Live scores for everyone.', 'Stats calculate themselves.', 'Tournament in under a minute.'],
      sub: 'Build the schedule, share the link вЂ” and every participant instantly has a live tournament page. Goals, standings, playoff and top scorers update on their own. You just run the game.',
      cta: 'Create a tournament вЂ” free', cta2: 'See how it works',
      proof: [['1 tournament free', 'all features included'], ['Ready', 'in 2 minutes'], ['Live link', 'no app needed']],
    },
    live: {
      badge: 'Live scoreboard',
      h2: ['Live scores вЂ”', 'on every screen.'],
      sub: 'Start Live mode before the match вЂ” scores, goals and cards appear instantly on every spectator\'s screen. Project onto a TV or big screen. No app, no sign-up, no delay.',
      items: [
        'Real-time match timer вЂ” running time, pause, extra time',
        'Goals and assists appear instantly for all spectators',
        'Full-screen mode вЂ” project onto a TV or LED display',
        'One link is enough вЂ” teams and fans follow without signing up',
      ],
    },
    stats: {
      h2: ['No more manual counting.', 'Everything calculates itself.'],
      sub: 'After every result вЂ” top scorers, goal difference, discipline update instantly. Zero manual work.',
      items: [
        'Live top scorers and assists table',
        'Cards and warnings tracked per team',
        'Automatic points and goal difference calculation',
        'Export full standings to PDF вЂ” for print, chat or social media',
      ],
    },
    features: {
      tag: 'Features',
      h2: 'Everything for your tournament.\nAlready inside.',
      sub: 'What used to take an evening now takes a minute.',
      items: [
        { title: 'Schedule in under a minute', desc: 'Pick a format, add teams вЂ” all matches generated automatically. Round-robin, playoff, group stage, league with playoff.' },
        { title: 'Live scoreboard without apps', desc: 'Enter goals on your phone вЂ” everyone sees the update instantly. No more waiting for a WhatsApp screenshot. Just a link.' },
        { title: 'Stats that never wait', desc: 'Points, goal difference, top scorers вЂ” refreshed after every match. Always accurate. Always live.' },
        { title: 'Playoff without the headache', desc: 'Winners advance automatically. Up to 64 teams, from round of 16 to the final.' },
        { title: 'Live tournament page', desc: 'Every tournament gets its own public URL. Share with teams before the game вЂ” everyone follows standings and live scores without signing up.' },
        { title: 'Branded reports in one click', desc: 'Standings, bracket, stats вЂ” ready for print, social media or chat. Looks sharp every time.' },
      ],
      sportsLabel: 'Works for any team sport',
      sports: ['Football', 'Futsal', 'Basketball', 'Volleyball', 'Hockey', 'Tennis', 'Table Tennis', 'Badminton'],
    },
    pricing: {
      h2: 'Choose your format.',
      sub: 'Start free. Scale without limits.',
      tabs: { monthly: 'Monthly', annual: 'Annual' },
      annualBadge: 'в€’25%',
      groupLabels: { pro: 'Unlocks in PRO', enterprise: 'Enterprise only' },
      features: [
        { label: 'All tournament formats', free: true, pro: true, enterprise: true },
        { label: 'Automated statistics', free: true, pro: true, enterprise: true },
        { label: 'Public tournament page', free: true, pro: true, enterprise: true },
        { label: 'PDF and PNG reports', free: true, pro: true, enterprise: true },
        { label: 'LIVE scoreboard', free: true, pro: true, enterprise: true },
        { label: 'Unlimited tournaments and teams', free: false, pro: true, enterprise: true },
        { label: 'Branded reports', free: false, pro: true, enterprise: true },
        { label: 'Adding co-editors', free: false, pro: true, enterprise: true },
        { label: 'Priority support', free: false, pro: true, enterprise: true },
        { label: 'Permanent leagues with seasons', free: false, pro: false, enterprise: true },
        { label: 'Advanced statistics & analytics', free: false, pro: false, enterprise: true },
        { label: 'Team and player profiles', free: false, pro: false, enterprise: true },
        { label: 'Match lineups', free: false, pro: false, enterprise: true },
        { label: 'Search engine visibility', free: false, pro: false, enterprise: true },
      ],
      free: {
        name: 'Starter',
        priceMonthly: '0 в‚ё',
        limit: '1 tournament В· up to 16 teams',
        cta: 'Start free',
      },
      pro: {
        name: 'PRO', badge: 'Organizers\' choice',
        priceMonthly: '4,990 в‚ё', perMonthly: '/ mo',
        priceAnnual: '44,990 в‚ё', perAnnual: '/ yr',
        priceOriginalAnnual: 'Instead of 59,880 в‚ё', savingAnnual: 'Save 14,890 в‚ё',
        cta: 'Go PRO',
      },
      enterprise: {
        name: 'Enterprise', badge: 'For leagues & federations', sub: 'Full platform capabilities',
        priceMonthly: 'from 39,990 в‚ё', perMonthly: '/ mo',
        priceAnnual: '349,990 в‚ё', perAnnual: '/ yr',
        priceOriginalAnnual: 'Instead of 479,880 в‚ё', savingAnnual: 'Save 129,890 в‚ё',
        cta: 'Get Enterprise',
      },
    },
    services: {
      h2: 'We handle everything',
      sub: 'Want to fully delegate? Our specialists come to you and take care of all the technical side.',
      items: [
        { icon: 'video', title: 'Professional video recording', desc: 'Our team comes to your tournament and professionally films every match on the pitch. Videos appear in your account automatically.', price: null, pricePer: null, badge: 'Coming Soon', badgeColor: 'blue' },
        { icon: 'trophy', title: 'On-site results operator', desc: 'Our specialist arrives and enters all match results directly into the platform in real time. You run the game вЂ” we handle the screen.', price: '19,990 в‚ё', pricePer: 'per day', badge: null, badgeColor: null },
      ],
    },
    contact: { h2: 'Got a question? Write to us.', sub: 'Fast responses. Real people, no bots.', wa: 'Message on WhatsApp', phone: '+7 (706) 409-20-21' },
    cta: { h2: 'Your next tournament starts today.', sub: 'One minute to sign up. Tournament ready. Participants blown away by the level.', btn: 'Start for free' },
    footer: {
      tagline: 'Create your first tournament in under a minute. Stats, live scoreboard and playoff вЂ” all automated.',
      cols: { product: 'Product', platform: 'Platform', connect: 'Connect' },
      links: { features: 'Features', pricing: 'Pricing', contact: 'Contact', login: 'Sign In', register: 'Sign Up', pro: 'PRO Plan' },
      legal: 'В© 2026 Tournable. All rights reserved.',
      privacy: 'Privacy Policy', terms: 'Terms of Service',
    },
  },
} as const

// в”Ђв”Ђв”Ђ WhatsApp icon в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.38 1.26 4.81L2.05 22l5.35-1.38c1.38.73 2.93 1.14 4.64 1.14 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.52 14.15c-.23.64-1.36 1.22-1.87 1.3-.48.08-1.08.11-1.74-.11-.4-.13-.92-.3-1.58-.58-2.78-1.2-4.6-4-4.74-4.19-.14-.19-1.1-1.47-1.1-2.8 0-1.33.7-1.98 1.0-2.25.26-.27.57-.34.75-.34.19 0 .38.01.54.01.17 0 .41-.06.63.48.23.56.77 1.88.84 2.01.07.14.11.3.02.48-.09.18-.14.29-.28.45-.14.16-.29.35-.41.47-.14.13-.28.27-.12.53.16.26.71 1.17 1.52 1.89.97.87 1.79 1.14 2.05 1.26.25.12.4.1.55-.06.15-.16.64-.75.81-1.01.17-.26.34-.21.57-.13.23.08 1.48.7 1.73.82.25.12.42.18.48.28.06.1.06.56-.17 1.2z"/>
    </svg>
  )
}

// в”Ђв”Ђв”Ђ Social icons в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function IconTelegram({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
}
function IconInstagram({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
}
function IconTikTok({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.84 4.84 0 01-1.01-.07z"/></svg>
}

// в”Ђв”Ђв”Ђ Feature icons map в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const FEAT_ICONS = [Zap, BarChart3, Trophy, Share2, Globe, Download]
const FEAT_STYLES = [
  { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', accent: 'bg-emerald-400' },
  { bg: 'bg-blue-500/15',    icon: 'text-blue-400',    accent: 'bg-blue-400' },
  { bg: 'bg-violet-500/15',  icon: 'text-violet-400',  accent: 'bg-violet-400' },
  { bg: 'bg-orange-500/15',  icon: 'text-orange-400',  accent: 'bg-orange-400' },
  { bg: 'bg-pink-500/15',    icon: 'text-pink-400',    accent: 'bg-pink-400' },
  { bg: 'bg-cyan-500/15',    icon: 'text-cyan-400',    accent: 'bg-cyan-400' },
]

// в”Ђв”Ђв”Ђ Audience cases в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const AUDIENCE: Record<Lang, { tag: string; h2: string; sub: string; cases: { tag: string; title: string; desc: string; cta: string; href: string }[] }> = {
  ru: {
    tag: 'Р”Р»СЏ РєРѕРіРѕ',
    h2: 'Tournable вЂ” РґР»СЏ РєР°Р¶РґРѕРіРѕ, РєС‚Рѕ РѕСЂРіР°РЅРёР·СѓРµС‚.',
    sub: 'Р›СЋР±РёС‚РµР»СЊ, РєР»СѓР± РёР»Рё С„РµРґРµСЂР°С†РёСЏ вЂ” РїР»Р°С‚С„РѕСЂРјР° РїРѕРґСЃС‚СЂР°РёРІР°РµС‚СЃСЏ РїРѕРґ РІР°СЃ.',
    cases: [
      { tag: 'Р›СЋР±РёС‚РµР»СЊСЃРєРёРµ С‚СѓСЂРЅРёСЂС‹', title: 'РћСЂРіР°РЅРёР·СѓРµС€СЊ С‚СѓСЂРЅРёСЂ СЃСЂРµРґРё РґСЂСѓР·РµР№, РєРѕРјР°РЅРґ СЂР°Р№РѕРЅР° РёР»Рё РѕС„РёСЃР°?', desc: 'РЎРѕР·РґР°Р№ СЂР°СЃРїРёСЃР°РЅРёРµ РјРµРЅСЊС€Рµ 1 РјРёРЅСѓС‚С‹, РїРѕРґРµР»РёСЃСЊ СЃСЃС‹Р»РєРѕР№ РІ С‡Р°С‚ вЂ” СѓС‡Р°СЃС‚РЅРёРєРё СЃР°РјРё СЃР»РµРґСЏС‚ Р·Р° С‚Р°Р±Р»РёС†РµР№ Рё СЃС‡С‘С‚РѕРј. Р‘РµР· Excel, Р±РµР· СЃРєСЂРёРЅРѕРІ РёР· WhatsApp.', cta: 'РќР°С‡Р°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ', href: '/register' },
      { tag: 'РЎРїРѕСЂС‚РёРІРЅС‹Рµ РєР»СѓР±С‹', title: 'Р’РµРґС‘С€СЊ СЂРµРіСѓР»СЏСЂРЅС‹Рµ СЃРѕСЂРµРІРЅРѕРІР°РЅРёСЏ РІРЅСѓС‚СЂРё РєР»СѓР±Р°?', desc: 'РќРµСЃРєРѕР»СЊРєРѕ С‚СѓСЂРЅРёСЂРѕРІ РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ, РЅРµСЃРєРѕР»СЊРєРѕ СЃРѕСЂРµРґР°РєС‚РѕСЂРѕРІ, Р±СЂРµРЅРґРёСЂРѕРІР°РЅРЅС‹Р№ РѕС‚С‡С‘С‚ РІ РѕРґРёРЅ РєР»РёРє. РЎС‚Р°С‚РёСЃС‚РёРєР° РїРѕ РІСЃРµРј СЃРµР·РѕРЅР°Рј РІСЃРµРіРґР° РїРѕРґ СЂСѓРєРѕР№.', cta: 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ PRO', href: '/register?plan=pro' },
      { tag: 'Р¤РµРґРµСЂР°С†РёРё Рё Р»РёРіРё', title: 'РџСЂРѕРІРѕРґРёС€СЊ РіРѕСЂРѕРґСЃРєРѕР№ С‡РµРјРїРёРѕРЅР°С‚ РёР»Рё РѕС„РёС†РёР°Р»СЊРЅСѓСЋ Р»РёРіСѓ?', desc: 'РџРѕСЃС‚РѕСЏРЅРЅР°СЏ Р»РёРіР° СЃ Р°СЂС…РёРІРѕРј СЃРµР·РѕРЅРѕРІ, РїСЂРѕС„РёР»СЏРјРё РєРѕРјР°РЅРґ Рё РёРіСЂРѕРєРѕРІ, СѓРіР»СѓР±Р»С‘РЅРЅРѕР№ СЃС‚Р°С‚РёСЃС‚РёРєРѕР№ Рё РґРѕСЃС‚СѓРїРЅРѕСЃС‚СЊСЋ РІ РїРѕРёСЃРєРѕРІС‹С… СЃРёСЃС‚РµРјР°С…. РљР°Рє Сѓ РїСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅС‹С… Р»РёРі вЂ” Р±РµР· С‚РµС…РЅРёС‡РµСЃРєРѕР№ РєРѕРјР°РЅРґС‹.', cta: 'Enterprise вЂ” РѕС‚ 39 990 в‚ё', href: '#contact' },
    ],
  },
  kz: {
    tag: 'РљС–Рј ТЇС€С–РЅ',
    h2: 'Tournable вЂ” Т±Р№С‹РјРґР°СЃС‚С‹СЂСѓС€С‹ ТЇС€С–РЅ.',
    sub: 'РҐРѕР±Р±Рё, РєР»СѓР± РЅРµРјРµСЃРµ С„РµРґРµСЂР°С†РёСЏ вЂ” РїР»Р°С‚С„РѕСЂРјР° СЃС–Р·РіРµ Р±РµР№С–РјРґРµР»РµРґС–.',
    cases: [
      { tag: 'РҐРѕР±Р±Рё С‚СѓСЂРЅРёСЂР»РµСЂ', title: 'Р”РѕСЃС‚Р°СЂ Р°СЂР°СЃС‹РЅРґР° РЅРµРјРµСЃРµ Р°СѓРґР°РЅРґР°Т“С‹ РєРѕРјР°РЅРґР°Р»Р°СЂ С‚СѓСЂРЅРёСЂС–РЅ Т±Р№С‹РјРґР°СЃС‚С‹СЂР°СЃС‹ТЈ Р±Р°?', desc: 'РљРµСЃС‚РµРЅС– 1 РјРёРЅСѓС‚С‚Р°РЅ Р°Р· СѓР°Т›С‹С‚С‚Р° Р¶Р°СЃР°ТЈС‹Р·, С‡Р°С‚Т›Р° СЃС–Р»С‚РµРјРµРЅС– Р¶С–Р±РµСЂС–ТЈС–Р· вЂ” Т›Р°С‚С‹СЃСѓС€С‹Р»Р°СЂ РєРµСЃС‚РµРЅС– Р¶У™РЅРµ РµСЃРµРїС‚С– У©Р·РґРµСЂС– Т›Р°РґР°Т“Р°Р»Р°Р№РґС‹. Excel Р¶РѕТ›, WhatsApp СЃРєСЂРёРЅС€РѕС‚С‹ Р¶РѕТ›.', cta: 'РўРµРіС–РЅ Р±Р°СЃС‚Р°Сѓ', href: '/register' },
      { tag: 'РЎРїРѕСЂС‚ РєР»СѓР±С‚Р°СЂС‹', title: 'РљР»СѓР± С–С€С–РЅРґРµ Р¶ТЇР№РµР»С– Р¶Р°СЂС‹СЃС‚Р°СЂ У©С‚РєС–Р·РµСЃС–ТЈ Р±Рµ?', desc: 'Р‘С–СЂРЅРµС€Рµ С‚СѓСЂРЅРёСЂ Р±С–СЂ СѓР°Т›С‹С‚С‚Р°, Р±С–СЂРЅРµС€Рµ СЃРѕСЂРµРґР°РєС‚РѕСЂ, Р±СЂРµРЅРґС‚РµР»РіРµРЅ РµСЃРµРї Р±С–СЂ С€РµСЂС‚СѓРјРµРЅ. Р‘Р°СЂР»С‹Т› РјР°СѓСЃС‹РјРґР°СЂРґС‹ТЈ СЃС‚Р°С‚РёСЃС‚РёРєР°СЃС‹ У™СЂТ›Р°С€Р°РЅ Т›РѕР»РґР°.', cta: 'PRO-РґС‹ Т›РѕР»РґР°РЅС‹Рї РєУ©СЂСѓ', href: '/register?plan=pro' },
      { tag: 'Р¤РµРґРµСЂР°С†РёСЏР»Р°СЂ РјРµРЅ Р»РёРіР°Р»Р°СЂ', title: 'ТљР°Р»Р°Р»С‹Т› С‡РµРјРїРёРѕРЅР°С‚ РЅРµРјРµСЃРµ СЂРµСЃРјРё Р»РёРіР° У©С‚РєС–Р·РµСЃС–ТЈ Р±Рµ?', desc: 'РњР°СѓСЃС‹РјРґР°СЂС‹ Р±Р°СЂ С‚Т±СЂР°Т›С‚С‹ Р»РёРіР°, РєРѕРјР°РЅРґР° РјРµРЅ РѕР№С‹РЅС€С‹ РїСЂРѕС„РёР»СЊРґРµСЂС–, С‚РµСЂРµТЈРґРµС‚С–Р»РіРµРЅ СЃС‚Р°С‚РёСЃС‚РёРєР° Р¶У™РЅРµ С–Р·РґРµСѓ Р¶ТЇР№РµР»РµСЂС–РЅРґРµ Т›РѕР»Р¶РµС‚С–РјРґС–Р»С–Рє вЂ” РєУ™СЃС–Р±Рё Р»РёРіР°Р»Р°СЂ СЃРёСЏТ›С‚С‹. РўРµС…РЅРёРєР°Р»С‹Т› РєРѕРјР°РЅРґР° Р¶РѕТ›.', cta: 'Enterprise вЂ” 39 990 в‚ё-РґР°РЅ', href: '#contact' },
    ],
  },
  en: {
    tag: 'Who it\'s for',
    h2: 'Tournable is for everyone who organises.',
    sub: 'Amateur, club or federation вЂ” the platform adapts to you.',
    cases: [
      { tag: 'Amateur tournaments', title: 'Organising a tournament with friends, your neighbourhood or the office?', desc: 'Build the schedule in under a minute, share the link вЂ” participants track standings and scores themselves. No Excel, no WhatsApp screenshots.', cta: 'Start free', href: '/register' },
      { tag: 'Sports clubs', title: 'Running regular competitions within your club?', desc: 'Multiple tournaments at once, multiple co-editors, branded report in one click. Season stats always at hand.', cta: 'Try PRO', href: '/register?plan=pro' },
      { tag: 'Federations & leagues', title: 'Running a city championship or an official league?', desc: 'Permanent league with season archive, team and player profiles, advanced analytics and search engine visibility вЂ” like professional leagues. No technical team needed.', cta: 'Enterprise вЂ” from 39,990 в‚ё', href: '#contact' },
    ],
  },
}

// в”Ђв”Ђв”Ђ Main component в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function LandingPage({ isLoggedIn = false, defaultLang = 'ru', userInitials }: { isLoggedIn?: boolean; defaultLang?: Lang; userInitials?: string }) {
  const [lang, setLang] = useState<Lang>(defaultLang)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const tx = T[lang]
  const audience = AUDIENCE[lang]

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: 'Inter,sans-serif' }}>

      {/* в”Ђв”Ђ Topbar в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <header className="sticky top-0 z-50" style={{ background: 'linear-gradient(90deg,#047857 0%,#059669 100%)', boxShadow: '0 2px 20px rgba(4,120,87,.25)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="font-black text-[17px] tracking-tight text-white" style={{ letterSpacing: '-.02em' }}>TOURNABLE</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {([['#features', tx.nav.features], ['#pricing', tx.nav.pricing], ['#contact', tx.nav.contact]] as [string, string][]).map(([href, label]) => (
              <a key={href} href={href} className="px-3.5 py-2 text-sm text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-all font-medium">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Language switcher вЂ” always visible */}
            <div className="flex items-center bg-white/15 rounded-lg p-0.5 gap-0.5">
              {(['ru', 'kz', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => { setLang(l); setLangCookie(l) }}
                  className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all ${lang === l ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-100 hover:text-white hover:bg-white/10'}`}>
                  {T[l].label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            {isLoggedIn ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  {tx.nav.dashboard}
                </Link>
                <Link href="/account" className="flex items-center justify-center w-9 h-9 rounded-xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-colors shadow-md" title="Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚">
                  {userInitials ?? '?'}
                </Link>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link href={`/login${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="text-sm font-medium text-emerald-100 hover:text-white px-3 py-2 transition-colors">{tx.nav.login}</Link>
                <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-md">
                  {tx.nav.start} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Hamburger вЂ” mobile/tablet */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label="РњРµРЅСЋ"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* в”Ђв”Ђ Mobile drawer в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/15" style={{ background: 'linear-gradient(180deg,#047857 0%,#059669 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-1">

              {/* Nav links */}
              {([['#features', tx.nav.features], ['#pricing', tx.nav.pricing], ['#contact', tx.nav.contact]] as [string, string][]).map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-base text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all font-medium">
                  {label}
                </a>
              ))}

              <div className="my-2 border-t border-white/15" />

              {/* CTA */}
              {isLoggedIn ? (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white/15 text-white font-semibold py-3 rounded-xl transition-colors text-base hover:bg-white/25">
                    {tx.nav.dashboard}
                  </Link>
                  <Link href="/account" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3.5 rounded-xl transition-colors shadow-md text-base">
                    {userInitials ? `${userInitials} В· ` : ''}Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href={`/login${lang !== 'ru' ? `?lang=${lang}` : ''}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center text-base font-semibold text-emerald-100 hover:text-white py-3 rounded-xl hover:bg-white/10 transition-colors">
                    {tx.nav.login}
                  </Link>
                  <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 font-black py-3.5 rounded-xl transition-colors shadow-md text-base">
                    {tx.nav.start} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* в”Ђв”Ђ Hero в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section className="relative overflow-hidden bg-[#0a2218] min-h-[680px] lg:min-h-[600px]">
        {/* Desktop background */}
        <Image src="/screens/hero-desktop.png" alt="" fill sizes="100vw"
          className="object-contain object-right hidden lg:block" priority />
        {/* Mobile background */}
        <Image src="/screens/hero-mobile.png" alt="" fill sizes="100vw"
          className="object-cover object-center block lg:hidden" priority />
        {/* Gradient overlay вЂ” ensures text legibility on left (desktop) / top (mobile) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a2218]/85 via-[#0a2218]/40 to-transparent hidden lg:block pointer-events-none" />
        <div className="absolute inset-0 block lg:hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0a2218 0%, #0a2218 55%, rgba(10,34,24,0.7) 75%, transparent 100%)' }} />
        {/* Content */}
        <div className="relative pt-14 pb-16 lg:pt-20 lg:pb-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="lg:max-w-[52%]">
              <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-7 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {tx.hero.badge}
              </div>
              <h1 className="text-[1.7rem] sm:text-[2.1rem] lg:text-[2.5rem] font-black leading-[1.08] tracking-tight text-white mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.hero.h1[0]}<br />
                {tx.hero.h1[1]}<br />
                <span className="text-emerald-400">{tx.hero.h1[2]}</span>
              </h1>
              <p className="text-base text-white/70 leading-relaxed mb-8 max-w-md">{tx.hero.sub}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/register${lang !== 'ru' ? `?lang=${lang}` : ''}`} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[15px] px-6 py-3.5 rounded-xl transition-colors shadow-lg shadow-black/30">
                  {tx.hero.cta} <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#how" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white font-medium text-sm px-4 py-3.5 transition-colors">
                  {tx.hero.cta2} <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Audience Cases в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section id="how" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-emerald-100 rounded-full px-4 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest">{audience.tag}</span>
            </span>
            <h2 className="text-[2rem] sm:text-[2.6rem] font-black tracking-tight text-gray-900 mb-3" style={{ letterSpacing: '-.03em' }}>{audience.h2}</h2>
            <p className="text-gray-400 text-base max-w-lg mx-auto">{audience.sub}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {audience.cases.map((c, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-7 flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 shrink-0">
                  <span className="text-[11px] font-black text-emerald-600">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">{c.tag}</div>
                <h3 className="font-black text-[17px] text-gray-900 leading-snug mb-3">{c.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">{c.desc}</p>
                <a href={c.href} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  {c.cta} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Live section вЂ” dark в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section className="bg-[#030712] py-20 lg:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Text */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-8 h-8 object-contain rounded-lg" />
                <span className="font-black text-white text-base tracking-tight">TOURNABLE</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
                {tx.live.badge}
              </div>
              <h2 className="text-[2rem] sm:text-[2.6rem] font-black text-white leading-[1.08] tracking-tight mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.live.h2[0]}<br /><span className="text-emerald-400">{tx.live.h2[1]}</span>
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-7">{tx.live.sub}</p>
              <ul className="space-y-3.5">
                {tx.live.items.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Real LED photo */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-2xl" style={{ background: 'radial-gradient(ellipse at center, rgba(5,150,105,.15) 0%, transparent 70%)' }} />
              <Image
                src="/screens/led.png"
                alt="Tournable LIVE вЂ” РѕРЅР»Р°Р№РЅ-С‚Р°Р±Р»Рѕ"
                width={900} height={600}
                className="w-full rounded-2xl shadow-2xl shadow-black/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Stats / phone section в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Real phone photo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-50 rounded-3xl -z-10" />
                <Image
                  src="/screens/phone.png"
                  alt="Tournable вЂ” С‚Р°Р±Р»РёС†Р° Р±РѕРјР±Р°СЂРґРёСЂРѕРІ"
                  width={400} height={700}
                  className="w-64 sm:w-72 rounded-2xl shadow-2xl shadow-gray-300/60"
                />
              </div>
            </div>
            {/* Text */}
            <div>
              <h2 className="text-[2rem] sm:text-[2.6rem] font-black tracking-tight leading-[1.08] mb-5" style={{ letterSpacing: '-.03em' }}>
                {tx.stats.h2[0]}<br /><span className="text-emerald-600">{tx.stats.h2[1]}</span>
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-7">{tx.stats.sub}</p>
              <ul className="space-y-3">
                {tx.stats.items.map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Features в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section id="features" className="py-24 lg:py-32 bg-[#030712]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">{tx.features.tag}</span>
            </span>
            <h2
              className="text-[2.4rem] sm:text-[3.2rem] font-black text-white mb-5 whitespace-pre-line"
              style={{ letterSpacing: '-.04em', lineHeight: 1.1 }}
            >{tx.features.h2}</h2>
            <p className="text-gray-400 text-base max-w-lg mx-auto leading-relaxed">{tx.features.sub}</p>
          </div>

          {/* Cards: scroll on mobile, 3-col grid on sm+ */}
          <div className="-mx-4 sm:mx-0">
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none px-4 sm:px-0 pb-4 sm:pb-0">
              {tx.features.items.map((feat, i) => {
                const Icon = FEAT_ICONS[i]
                const s = FEAT_STYLES[i]
                return (
                  <div key={i} className="snap-start shrink-0 w-[78vw] sm:w-auto sm:shrink relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 flex flex-col hover:bg-white/[0.06] hover:border-white/[0.15] hover:-translate-y-1.5 transition-all duration-300 group overflow-hidden cursor-default">
                    {/* Number watermark */}
                    <span
                      className="absolute -top-2 right-4 font-black text-white/[0.05] select-none"
                      style={{ fontSize: '5rem', letterSpacing: '-.04em', lineHeight: 1 }}
                    >{String(i + 1).padStart(2, '0')}</span>
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                      <Icon className={`w-7 h-7 ${s.icon}`} />
                    </div>
                    {/* Text */}
                    <h3 className="font-black text-[17px] sm:text-lg text-white leading-snug mb-3">{feat.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed flex-1">{feat.desc}</p>
                    {/* Bottom accent */}
                    <div className={`mt-6 h-[2px] w-8 rounded-full ${s.accent} group-hover:w-14 transition-all duration-500`} />
                  </div>
                )
              })}
            </div>
            {/* Scroll dots вЂ” mobile only */}
            <div className="flex justify-center gap-1.5 mt-5 sm:hidden">
              {tx.features.items.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>

          {/* Sports compatibility row */}
          <div className="mt-14 border-t border-white/[0.06] pt-10 text-center">
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-5">{tx.features.sportsLabel}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {tx.features.sports.map((sport) => (
                <span key={sport} className="text-xs text-gray-500 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 font-medium">{sport}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Pricing в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section id="pricing" className="bg-gray-50 py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-[2rem] sm:text-[2.4rem] font-black tracking-tight mb-3" style={{ letterSpacing: '-.03em' }}>{tx.pricing.h2}</h2>
            <p className="text-gray-400 text-base">{tx.pricing.sub}</p>
          </div>

          {/* Billing tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-white border border-gray-200 rounded-2xl p-1 gap-1 shadow-sm">
              {(['monthly', 'annual'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${billing === b ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tx.pricing.tabs[b]}
                  {b === 'annual' && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${billing === 'annual' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>{tx.pricing.annualBadge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 items-stretch mt-5">

            {/* в”Ђв”Ђ Free в”Ђв”Ђ */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-[.12em] mb-3">{tx.pricing.free.name}</div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-4xl font-black text-gray-900 tracking-tight">0 в‚ё</span>
              </div>
              <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 self-start">{tx.pricing.free.limit}</span>
              <div className="border-t border-gray-100 mt-5 mb-4" />
              <ul className="space-y-2 flex-1 mb-5">
                {tx.pricing.features.map(f => (
                  <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.free ? 'text-gray-700' : 'text-gray-300'}`}>
                    {f.free
                      ? <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      : <X className="w-3.5 h-3.5 text-gray-200 mt-0.5 shrink-0" />}
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm">
                {tx.pricing.free.cta}
              </Link>
            </div>

            {/* в”Ђв”Ђ PRO в”Ђв”Ђ */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                <span className="bg-emerald-950 text-emerald-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {tx.pricing.pro.badge}
                </span>
              </div>
              <div className="relative rounded-3xl p-6 flex flex-col flex-1 overflow-hidden" style={{ background: 'linear-gradient(145deg,#047857 0%,#059669 60%,#10b981 100%)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 flex flex-col flex-1">
                  <div className="text-[10px] font-black text-emerald-300 uppercase tracking-[.12em] mb-3">{tx.pricing.pro.name}</div>
                  {billing === 'monthly' ? (
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-4xl font-black text-white tracking-tight">{tx.pricing.pro.priceMonthly}</span>
                      <span className="text-sm text-emerald-200 font-medium">{tx.pricing.pro.perMonthly}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-4xl font-black text-white tracking-tight">{tx.pricing.pro.priceAnnual}</span>
                        <span className="text-sm text-emerald-200 font-medium">{tx.pricing.pro.perAnnual}</span>
                      </div>
                      <div className="text-sm text-emerald-200/60 mb-2">{tx.pricing.pro.priceOriginalAnnual}</div>
                      <div className="inline-flex items-center gap-1.5 self-start bg-emerald-950/40 rounded-xl px-3 py-1 mb-1">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        <span className="text-xs font-bold text-emerald-100">{tx.pricing.pro.savingAnnual}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-emerald-400/20 mt-5 mb-4" />
                  <ul className="space-y-2 flex-1 mb-5">
                    {tx.pricing.features.flatMap((f, i) => {
                      const rows = []
                      if (i === 5) rows.push(
                        <li key="sep-pro" className="flex items-center gap-2 pt-2 pb-0.5">
                          <span className="flex-1 h-px bg-emerald-400/20" />
                          <span className="text-[9px] font-black text-emerald-200/60 uppercase tracking-widest">{tx.pricing.groupLabels.pro}</span>
                          <span className="flex-1 h-px bg-emerald-400/20" />
                        </li>
                      )
                      if (i === 9) rows.push(
                        <li key="sep-ent" className="flex items-center gap-2 pt-2 pb-0.5">
                          <span className="flex-1 h-px bg-emerald-400/10" />
                          <span className="text-[9px] font-black text-emerald-300/30 uppercase tracking-widest">{tx.pricing.groupLabels.enterprise}</span>
                          <span className="flex-1 h-px bg-emerald-400/10" />
                        </li>
                      )
                      rows.push(
                        <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.pro ? 'text-emerald-50' : 'text-emerald-300/35'}`}>
                          {f.pro
                            ? <Check className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
                            : <X className="w-3.5 h-3.5 text-emerald-300/25 mt-0.5 shrink-0" />}
                          {f.label}
                        </li>
                      )
                      return rows
                    })}
                  </ul>
                  <Link href="/register?plan=pro" className="block text-center bg-white text-emerald-700 hover:bg-emerald-50 font-black py-3 rounded-2xl transition-colors shadow-xl shadow-black/20 text-sm">
                    {tx.pricing.pro.cta}
                  </Link>
                </div>
              </div>
            </div>

            {/* в”Ђв”Ђ Enterprise в”Ђв”Ђ */}
            <div className="relative flex flex-col">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                <span className="bg-purple-950 text-purple-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  {tx.pricing.enterprise.badge}
                </span>
              </div>
              <div className="bg-white border-2 border-purple-200 rounded-3xl p-6 flex flex-col flex-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                <div className="text-[10px] font-black text-purple-500 uppercase tracking-[.12em] mb-3">{tx.pricing.enterprise.name}</div>
                {billing === 'monthly' ? (
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-black text-gray-900 tracking-tight">{tx.pricing.enterprise.priceMonthly}</span>
                    <span className="text-sm text-gray-500 font-medium">{tx.pricing.enterprise.perMonthly}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">{tx.pricing.enterprise.priceAnnual}</span>
                      <span className="text-sm text-gray-500 font-medium">{tx.pricing.enterprise.perAnnual}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">{tx.pricing.enterprise.priceOriginalAnnual}</div>
                    <div className="inline-flex items-center gap-1.5 self-start bg-purple-50 rounded-xl px-3 py-1 mb-1">
                      <Star className="w-3 h-3 text-purple-400" fill="currentColor" />
                      <span className="text-xs font-bold text-purple-600">{tx.pricing.enterprise.savingAnnual}</span>
                    </div>
                  </>
                )}
                <p className="text-xs text-gray-400 mt-2">{tx.pricing.enterprise.sub}</p>
                <div className="border-t border-purple-100 mt-5 mb-4" />
                <ul className="space-y-2 flex-1 mb-5">
                  {tx.pricing.features.flatMap((f, i) => {
                    const rows = []
                    if (i === 9) rows.push(
                      <li key="sep-ent" className="flex items-center gap-2 pt-2 pb-0.5">
                        <span className="flex-1 h-px bg-purple-200" />
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{tx.pricing.groupLabels.enterprise}</span>
                        <span className="flex-1 h-px bg-purple-200" />
                      </li>
                    )
                    rows.push(
                      <li key={f.label} className={`flex items-start gap-2 text-[13px] ${f.enterprise ? 'text-gray-700' : 'text-gray-300'}`}>
                        {f.enterprise
                          ? <Check className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                          : <X className="w-3.5 h-3.5 text-gray-200 mt-0.5 shrink-0" />}
                        {f.label}
                      </li>
                    )
                    return rows
                  })}
                </ul>
                <Link
                  href="/register?plan=enterprise"
                  className="block text-center font-black py-3 rounded-2xl transition-colors text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
                >
                  {tx.pricing.enterprise.cta}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Additional Services в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section className="py-24 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>{tx.services.h2}</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">{tx.services.sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {tx.services.items.map((svc) => (
              <div key={svc.title} className="relative group bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden">
                {/* Subtle bg gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-transparent pointer-events-none" />
                {svc.badge && (
                  <span className="absolute top-5 right-5 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-blue-100 text-blue-600">{svc.badge}</span>
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-emerald-50">
                    {svc.icon === 'video'
                      ? <Video className="w-6 h-6 text-blue-500" />
                      : <Trophy className="w-6 h-6 text-emerald-600" />}
                  </div>
                  <h3 className="font-black text-xl text-gray-900 mb-3 leading-tight">{svc.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{svc.desc}</p>
                  {svc.price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-600">{svc.price}</span>
                      <span className="text-sm text-gray-400 font-medium">{svc.pricePer}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-500 font-semibold">{svc.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* в”Ђв”Ђ Contact в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section id="contact" className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-[2rem] sm:text-[2.5rem] font-black tracking-tight mb-4" style={{ letterSpacing: '-.03em' }}>{tx.contact.h2}</h2>
            <p className="text-gray-400 text-lg">{tx.contact.sub}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* WhatsApp card */}
            <a href="https://wa.me/message/YHLE2IFII4MSJ1" target="_blank" rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-3xl p-8 flex flex-col gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#128C7E 0%,#25D366 100%)', boxShadow: '0 8px 40px rgba(37,211,102,.2)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <IconWhatsApp className="w-8 h-8 text-white" />
                </div>
                <div className="font-black text-2xl text-white">WhatsApp</div>
              </div>
              <div className="relative z-10 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors self-start">
                {tx.contact.wa} <ArrowRight className="w-4 h-4" />
              </div>
            </a>

            {/* Phone card */}
            <a href="tel:+77064092021"
              className="group relative overflow-hidden bg-gray-900 rounded-3xl p-8 flex flex-col gap-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:bg-gray-800">
              <div className="absolute inset-0 pointer-events-none opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="relative z-10 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Phone className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="font-black text-2xl text-white">{lang === 'en' ? 'Call us' : lang === 'kz' ? 'ТљРѕТЈС‹СЂР°Сѓ С€Р°Р»Сѓ' : 'РџРѕР·РІРѕРЅРёС‚СЊ'}</div>
              </div>
              <div className="relative z-10 inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors self-start">
                {tx.contact.phone} <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </div>

          {/* Email line */}
          <p className="text-center mt-8 text-sm text-gray-400">
            {lang === 'en' ? 'Or write to us by email:' : lang === 'kz' ? 'РќРµРјРµСЃРµ СЌР»РµРєС‚СЂРѕРЅРґС‹ РїРѕС€С‚Р°РјРµРЅ Р¶Р°Р·С‹ТЈС‹Р·:' : 'РР»Рё РЅР°РїРёС€РёС‚Рµ РЅР° РїРѕС‡С‚Сѓ:'}{' '}
            <a href="mailto:info@tournable.app" className="text-emerald-600 font-semibold hover:underline">info@tournable.app</a>
          </p>
        </div>
      </section>

      {/* в”Ђв”Ђ Final CTA в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#047857 0%,#059669 50%,#10b981 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.07) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <h2 className="text-[2rem] sm:text-[2.5rem] font-black text-white mb-4 tracking-tight" style={{ letterSpacing: '-.03em' }}>{tx.cta.h2}</h2>
          <p className="text-emerald-100 text-lg mb-10">{tx.cta.sub}</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 font-black px-10 py-4 rounded-2xl transition-colors text-base shadow-2xl shadow-black/20">
            {tx.cta.btn} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* в”Ђв”Ђ Footer в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <footer className="bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image src="/logo-white.png" alt="Tournable" width={36} height={36} className="w-9 h-9 object-contain rounded-xl" />
                <span className="font-black text-white text-lg tracking-tight">TOURNABLE</span>
              </Link>
              <p className="text-sm leading-relaxed text-gray-500 mb-6">{tx.footer.tagline}</p>
              <div className="flex items-center gap-3">
                {[
                  { href: 'https://instagram.com/tournable_app', Icon: IconInstagram },
                  { href: 'https://tiktok.com/@tournable', Icon: IconTikTok },
                  { href: 'https://t.me/tournable', Icon: IconTelegram },
                ].map(({ href, Icon }) => (
                  <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
                <a href="mailto:info@tournable.app" className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.product}</h4>
              <ul className="space-y-3">
                {([['#features', tx.footer.links.features], ['#pricing', tx.footer.links.pricing], ['#contact', tx.footer.links.contact]] as [string,string][]).map(([href, label]) => (
                  <li key={href}><a href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.platform}</h4>
              <ul className="space-y-3">
                {([['/login', tx.footer.links.login], ['/register', tx.footer.links.register], ['/register?plan=pro', tx.footer.links.pro]] as [string,string][]).map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-xs font-black text-white mb-5 uppercase tracking-widest">{tx.footer.cols.connect}</h4>
              <ul className="space-y-3">
                <li><a href="https://wa.me/message/YHLE2IFII4MSJ1" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"><IconWhatsApp className="w-3.5 h-3.5" />WhatsApp</a></li>
                <li><a href="tel:+77064092021" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-2"><Phone className="w-3.5 h-3.5" />+7 (706) 409-20-21</a></li>
                <li><a href="mailto:info@tournable.app" className="text-sm text-gray-500 hover:text-white transition-colors">info@tournable.app</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">{tx.footer.legal}</p>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">{tx.footer.privacy}</Link>
              <Link href="/terms" className="hover:text-gray-400 transition-colors">{tx.footer.terms}</Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportWidget lang={lang} />
    </div>
  )
}
