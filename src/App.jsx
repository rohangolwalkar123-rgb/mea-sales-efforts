import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronDown, LogOut, LayoutDashboard, PenSquare, Check,
  Radio, Users, TrendingUp, Calendar, Loader2, AlertCircle, Building2, Handshake,
  ListChecks, Search, Sparkles, Download, Pencil, Trash2, X, ShieldCheck,
} from "lucide-react";
import {
  subscribeEntries,
  subscribeTeam,
  addEntry as fsAddEntry,
  updateEntry as fsUpdateEntry,
  deleteEntry as fsDeleteEntry,
  seedIfEmpty,
  addTeamMember,
  getLastExport as fsGetLastExport,
  setLastExport as fsSetLastExport,
} from "./lib/store";

/* ------------------------------------------------------------------ */
/* Reference data (mirrors the original workbook's hidden lookup tabs) */
/* ------------------------------------------------------------------ */
const DEFAULT_TEAM = [
  "Anas", "Arun", "Arun Selvam", "Bashar Hemadany", "Gayathry",
  "Rohan Golwalkar", "Shubham", "Sweety Jain",
];
const LEADERSHIP_NAME = "CEO/Higher Management";
const ADMIN_NAME = "Rohan Golwalkar";
const LOGIN_ROSTER = [...DEFAULT_TEAM, LEADERSHIP_NAME];

const isLeadership = (user) => user === LEADERSHIP_NAME;
const isAdmin = (user) => user === ADMIN_NAME;
const canSeeAllData = (user) => isAdmin(user) || isLeadership(user);
const canEditRow = (user, row) => isAdmin(user) || (!isLeadership(user) && row.name === user);
const canLogForOthers = (user) => isAdmin(user);
const TASK_TYPES = [
  "New Logo Introduction", "Discovery Meeting", "Demo / Product Showcase",
  "Bid/Proposal Defence", "Deal Follow up", "Partner Meeting",
  "Commercial Negotiation", "Contract / MSA Discussion", "Delivery Review",
  "Internal Review", "Interview", "Renewal Discussion/Closures",
  "Existing Account Health Check",
];
const LEVELS = ["C Level", "Senior Management", "Working Team"];
const PURSUIT_TYPES = ["EN", "NN", "ER", "Partner Connect"];

const LEVEL_COLOR = { "C Level": "#B8862E", "Senior Management": "#1F7A6C", "Working Team": "#3E5C8A" };
const PURSUIT_COLOR = { EN: "#B8862E", NN: "#1F7A6C", ER: "#3E5C8A", "Partner Connect": "#8A5A9E" };

/* Seed data — carried over from the original workbook's "Detailed Tasks" tab
   so the dashboard isn't empty on day one. Written once to Firestore the
   first time the app runs against a fresh project (see seedIfEmpty). New
   entries logged through the app are appended on top of this. */
const SEED_ENTRIES = [{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Bid/Proposal Defence","accountName":"Dubai Airports","clientName":"Nour Noufal","pursuitType":"EN","level":"Working Team","designation":"Senior Category Specialist-Supply Management","opportunity":"Lounge service on DET Platform","date":"2026-07-20","summary":"Discussion on the RFP and final proposal submitted"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Deal Follow up","accountName":"SRIT - CBD Contract","clientName":"Raja Reddy","pursuitType":"EN","level":"C Level","designation":"CEO","opportunity":"OutSystems upgrade for CBD","date":"2026-07-20","summary":"Met with partner on the contract status which is awaiting closure"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"New Logo Introduction","accountName":"DWTC (Raqmiyat)","clientName":"Mahesh V","pursuitType":"ER","level":"Senior Management","designation":"Director-Business Solutions","opportunity":"DET 360 Intergration for DWTC","date":"2026-07-20","summary":"Introdction call , OutSystems Expertise and delivery engagement"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Renewal Discussion/Closures","accountName":"e& Enterprise","clientName":"Saurabh","pursuitType":"ER","level":"Senior Management","designation":"Director -Data & AI","opportunity":"AWS - Yettle Project","date":"2026-07-20","summary":"Follow up on contract renewal and approaval of Pending timesheets"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Existing Account Health Check","accountName":"Rihal","clientName":"Tariq Al Numi","pursuitType":"ER","level":"C Level","designation":"COO","opportunity":"OutSystems Resource Engagement - PDO & OIA","date":"2026-07-21","summary":"In person meeting in Oman for pending payments and contract renewal"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Contract / MSA Discussion","accountName":"MHD Infotech","clientName":"Haitham Haggag","pursuitType":"EN","level":"Working Team","designation":"Program Manager","opportunity":"OutSystems Resource Engagement - MOH","date":"2026-07-21","summary":"In person meeting in Oman for contract discussion and new oppurchunities"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"New Logo Introduction","accountName":"DIFC Courts","clientName":"Ajaz Wani","pursuitType":"EN","level":"Working Team","designation":"Assistant Manager ‑ Digital Services","opportunity":"DET 360 Intergration for DIFC Courts","date":"2026-07-22","summary":"Introduction call to understand the requirement , follow up call on 7th Aug 2026"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Commercial Negotiation","accountName":"Supreme Council of Environment (Computer World)","clientName":"Snehal","pursuitType":"ER","level":"Senior Management","designation":"Director - AWS services","opportunity":"Production Support Contract - SCE","date":"2026-07-22","summary":"Final call to provide BAFO rates for the support contract"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Deal Follow up","accountName":"EWEC","clientName":"Oliver Pereira","pursuitType":"NN","level":"Working Team","designation":"Specialist – Business Analyst","opportunity":"EWEC's Data & AI program","date":"2026-07-22","summary":"Call with prospect to discuss for the clarifications raised on submitted proposal"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Bid/Proposal Defence","accountName":"GEMS Education","clientName":"Elaine Cuaderno","pursuitType":"EN","level":"Senior Management","designation":"Executive Director","opportunity":"GEMS - Beyond 100","date":"2026-07-23","summary":"Follow up on the submitted proposal and discussion on commercials"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Existing Account Health Check","accountName":"GEMS Education","clientName":"Elaine Cuaderno","pursuitType":"EN","level":"Senior Management","designation":"Executive Director","opportunity":"GEMS MSA renewal","date":"2026-07-23","summary":"Submitted Xebia details on the new vendor portal"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Deal Follow up","accountName":"Dubai Chambers","clientName":"Marwan AlHemeiri","pursuitType":"NN","level":"Working Team","designation":"Manager - Digital Transformation","opportunity":"DET 360 Intergration","date":"2026-07-23","summary":"New logo deal follow up. Awaiting next steps for resource onboarding"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Commercial Negotiation","accountName":"Supreme Council of Environment (Computer World)","clientName":"Snehal","pursuitType":"EN","level":"Senior Management","designation":"Director - AWS services","opportunity":"Production Support Contract - SCE","date":"2026-07-23","summary":"Meeting with end customer -SCE to finalise the contract. Contract closed and PO received."},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Partner Meeting","accountName":"Rihal","clientName":"Luke","pursuitType":"Partner Connect","level":"Senior Management","designation":"Director- Managed Services","opportunity":"New OS resource requirement","date":"2026-07-23","summary":"Meeting with Rihal to discuss on new oppurchunities"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Partner Meeting","accountName":"OutSystems","clientName":"Ahmed","pursuitType":"Partner Connect","level":"Working Team","designation":"Account Executive","opportunity":"FlyNas - New Logo","date":"2026-07-24","summary":"Meeting with Ahmed to discuss Xebia Airline domain capability. Next meeting on 27th July."},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Existing Account Health Check","accountName":"e& Enterprise","clientName":"Saurabh","pursuitType":"EN","level":"Senior Management","designation":"Director -Data & AI","opportunity":"AWS - Yettle Project","date":"2026-07-24","summary":"Follow up meeting for timesheet approval"},{"weekOf":"2026-07-20","name":"Arun Selvam","taskType":"Demo / Product Showcase","accountName":"Liva Insurnace","clientName":"Ram","pursuitType":"EN","level":"C Level","designation":"CTO","opportunity":"Liva - Member Portal Migration Project","date":"2026-07-24","summary":"Meeting with CTO to showcase Xebia ACE platfrom for the migration of existing portal from OutSystems to Native"},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Google","clientName":"Abdullah Awehabi","pursuitType":"Partner Connect","level":"Senior Management","designation":"FSR- Airlines","opportunity":"Saudia Reselling","date":"2026-07-23","summary":"Connect on the status and general discussion"},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"Contract / MSA Discussion","accountName":"CMA","clientName":"Abdullah Almayouf","pursuitType":"NN","level":"Senior Management","designation":"Procurement Lead","opportunity":"Appian to Kubernetes migration contract closure","date":"2026-07-23","summary":""},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Cenomi","clientName":"Binoo Josepph","pursuitType":"EN","level":"C Level","designation":"CIO","opportunity":"Discussion on upcoming opportunities and courtesy meeting","date":"2026-07-23","summary":""},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"New Logo Introduction","accountName":"SAB","clientName":"Sara Al Sharif","pursuitType":"NN","level":"Senior Management","designation":"Procurement Lead","opportunity":"Data and AI","date":"2026-07-20","summary":"Introduction, Vendor registration and Rate card discussion"},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Saudia","clientName":"Hazem Al usalami","pursuitType":"NN","level":"Senior Management","designation":"Director IT","opportunity":"GCP Reselling","date":"2026-07-22","summary":"Had a courtsey one o one call on the proposal submitted and next steps. Have been connecting well with him regularly"},{"weekOf":"2026-07-20","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Riyadh Air","clientName":"Arnuad Van","pursuitType":"NN","level":"C Level","designation":"Head of IT","opportunity":"Managed Services","date":"2026-07-22","summary":"Had a courtsey one o one call on the proposal submitted and next steps. Highligted on the FINOPS offering that is part of the proposal"},{"weekOf":"2026-07-20","name":"Gayathry","taskType":"Commercial Negotiation","accountName":"KFH (Bahrain)","clientName":"Girish Menon","pursuitType":"ER","level":"Senior Management","designation":"Head of Procurement","opportunity":"Rate card revision for onshore resource","date":"2026-07-23","summary":"Discussed on the rate card revision for onshore resource"},{"weekOf":"2026-07-20","name":"Gayathry","taskType":"Deal Follow up","accountName":"ABO","clientName":"Jitul","pursuitType":"EN","level":"Senior Management","designation":"Head of Channels(Banking)","opportunity":"New OS resource requirement","date":"2026-07-20","summary":"Discussed on new resource oppurtunities and Onshore replacement"},{"weekOf":"2026-07-20","name":"Gayathry","taskType":"Existing Account Health Check","accountName":"KFH (Egypt)","clientName":"Sherif Fouad","pursuitType":"EN","level":"C Level","designation":"Chief of IT and Governance","opportunity":"Delivery review","date":"2026-07-20","summary":"Existing project review and concerns"},{"weekOf":"2026-07-20","name":"Gayathry","taskType":"Deal Follow up","accountName":"KFH (Egypt)","clientName":"Fady Nemr","pursuitType":"EN","level":"C Level","designation":"Head of Procurement","opportunity":"PO follow up","date":"2026-07-22","summary":"Discussion with procurement on commercial negotiation and PO for EN oppurtunity"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"SAB","clientName":"Sara Al Sharif","pursuitType":"NN","level":"Senior Management","designation":"Procurement Lead","opportunity":"Data and AI","date":"2026-07-20","summary":"Introduction, Vendor registration and Rate card discussion"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"IBL","clientName":"Hansley Chadee","pursuitType":"NN","level":"Senior Management","designation":"Head of Architecture","opportunity":"Data, AI and App Development","date":"2026-07-24","summary":"Did a walkthrough of capabilities along with Shubham, The client hsd data and AI requirement on AWS and wants a meeting onsite in first week of August along with AWS"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"Saudia","clientName":"Hazem Al usalami","pursuitType":"NN","level":"Senior Management","designation":"Director IT","opportunity":"GCP Reselling","date":"2026-07-22","summary":"Had a courtsey one o one call on the proposal submitted and next steps. Have been connecting well with him regularly"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"Riyadh Air","clientName":"Arnuad Van","pursuitType":"NN","level":"C Level","designation":"Head of IT","opportunity":"Managed Services","date":"2026-07-22","summary":"Had a courtsey one o one call on the proposal submitted and next steps. Highligted on the FINOPS offering that is part of the proposal"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Contract / MSA Discussion","accountName":"Agthia","clientName":"Saurabh Garg","pursuitType":"NN","level":"Senior Management","designation":"Head of Apps","opportunity":"MDM and Data Lake","date":"2026-07-22","summary":"Detailed discussion on the Contract along for the scope of work"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Contract / MSA Discussion","accountName":"Agthia","clientName":"Uday Bhaskar","pursuitType":"NN","level":"Senior Management","designation":"Procurement Lead","opportunity":"MDM and Data Lake","date":"2026-07-23","summary":"Detailed discussion on the Contract along for T&Cs"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Bid/Proposal Defence","accountName":"HCT","clientName":"Dr Sabeena + Others","pursuitType":"NN","level":"C Level","designation":"Head of Business","opportunity":"Migration to Azure Fabric","date":"2026-07-23","summary":"Detailed proposal discussion and overview of commercials. There is a workshop that we have  proposed as during the meeting a few things came up reg scope clarity"},{"weekOf":"2026-07-20","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"OutSystems","clientName":"Ahmed","pursuitType":"Partner Connect","level":"Working Team","designation":"Account Executive","opportunity":"FlyNas - New Logo","date":"2026-07-24","summary":"Meeting with Ahmed to discuss Xebia Airline domain capability. Next meeting on 27th July."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"New Logo Introduction","accountName":"Dubai Media Council","clientName":"Rashid AlMarri","pursuitType":"NN","level":"C Level","designation":"CEO","opportunity":"Service Integration","date":"2026-07-22","summary":"Interested in onboarding Xebia for service integration. Xebia to share proposal and profiles."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"New Logo Introduction","accountName":"IBL","clientName":"Hansley Chadee","pursuitType":"NN","level":"Senior Management","designation":"Head of Architecture","opportunity":"Data, AI and App Development","date":"2026-07-24","summary":"Did a walkthrough of capabilities along with Rohan, The client has data and AI requirement on AWS and wants a meeting onsite in first week of August along with AWS"},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Huda Humaid","pursuitType":"ER","level":"Senior Management","designation":"Head of Digital Transformation","opportunity":"Renewal of existing contract","date":"2026-07-21","summary":"Client has requested for options for continuing the engagement. Xebia will share the options for final sign off of the contract."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Existing Account Health Check","accountName":"ADQ","clientName":"Nitin Pandey","pursuitType":"EN","level":"Working Team","designation":"Senior Manager - Data & AI","opportunity":"Status check and New Opportunities","date":"2026-07-23","summary":"Met the client to understand changes happening in the account. Got introduced to new stakeholder for new business opportunities."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Ahmad Al Eideh","pursuitType":"ER","level":"Working Team","designation":"Program Manager","opportunity":"Renewal of existing contract","date":"2026-07-21","summary":"Client finalized the option with 3 resource for renewal. Xebia to share the SOW with the client."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Deal Follow up","accountName":"DMCC","clientName":"Dinesh Singh","pursuitType":"NN","level":"Working Team","designation":"Senior Manager - IT","opportunity":"Framework Agreement and Use Case Demo","date":"2026-07-23","summary":"Met the client to discuss the rate card and onboard Xebia in the framework agreement. Also, checked for business availability for use case demo."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Ahmad Al Eideh","pursuitType":"ER","level":"Working Team","designation":"Program Manager","opportunity":"Renewal of existing contract","date":"2026-07-21","summary":"Submitted the SOW and discussed with the procurement team on the next steps to finalize the documentation for extension."},{"weekOf":"2026-07-20","name":"Shubham","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Ahmad Al Eideh","pursuitType":"ER","level":"Working Team","designation":"Program Manager","opportunity":"Renewal of existing contract","date":"2026-08-04","summary":"SOW is approved at head level. Awaiting signatures from the CEO."},{"weekOf":"2026-07-20","name":"Sweety Jain","taskType":"Discovery Meeting","accountName":"DET","clientName":"Dr Marwan","pursuitType":"EN","level":"C Level","designation":"CDAO","opportunity":"Data & AI","date":"2026-07-23","summary":"Discussion about Xebia capabilties & DET roadmap and use cases"},{"weekOf":"2026-07-20","name":"Sweety Jain","taskType":"Deal Follow up","accountName":"Core42","clientName":"Nawaz Khan","pursuitType":"EN","level":"Senior Management","designation":"Procurement Lead","opportunity":"Discussion on open positions","date":"2026-07-24","summary":"Discussion on open positions and the interview process with Core42"},{"weekOf":"2026-07-20","name":"Sweety Jain","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Huda Humaid","pursuitType":"ER","level":"Senior Management","designation":"Head of Digital Transformation","opportunity":"Renewal of existing contract","date":"2026-07-21","summary":"Client has requested for options for continuing the engagement. Xebia will share the options for final sign off of the contract."},{"weekOf":"2026-07-20","name":"Sweety Jain","taskType":"Existing Account Health Check","accountName":"ADQ","clientName":"Nitin Pandey","pursuitType":"EN","level":"Working Team","designation":"Senior Manager - Data & AI","opportunity":"Status check and New Opportunities","date":"2026-07-23","summary":"Met the client to understand changes happening in the account. Got introduced to new stakeholder for new business opportunities."},{"weekOf":"2026-07-20","name":"Sweety Jain","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Ahmad Al Eideh","pursuitType":"ER","level":"Working Team","designation":"Program Manager","opportunity":"Renewal of existing contract","date":"2026-07-22","summary":"Client finalized the option with 3 resource for renewal. Xebia to share the SOW with the client."},{"weekOf":"2026-07-27","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Yves Khalil","pursuitType":"Partner Connect","level":"Senior Management","designation":"Director, Education, MEA","opportunity":"Expansion across MEA education","date":"2026-07-27","summary":"GTM strategy for overall MEA, replication of use cases across selected edu accounts across MEA, introductions to more AE's"},{"weekOf":"2026-07-27","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Hatim Nagarwala","pursuitType":"Partner Connect","level":"Senior Management","designation":"Senior SE, Developer Productivity, MEA","opportunity":"GitHub motion across MEA","date":"2026-07-28","summary":"Reigniting conversations around GitHub, following up on the workshops we did and guidance on how we can partner on GitHub opportunities"},{"weekOf":"2026-07-27","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Haytham Alazzouni","pursuitType":"Partner Connect","level":"Working Team","designation":"Cloud and AI SSP, Microsoft KSA","opportunity":"Opportunities within KSA public sector","date":"2026-07-29","summary":"Xebia introductions, Agentic led SDLC capabilties and potential opportunities within his accounts."},{"weekOf":"2026-07-27","name":"Anas","taskType":"New Logo Introduction","accountName":"Etisalat &","clientName":"Baris Bickacki","pursuitType":"NN","level":"Working Team","designation":"Manager, Customer Experience","opportunity":"Xebia capabilities within CX","date":"2026-07-29","summary":"Salesforce led opportunities within BFSI, onboarding of Xebia within CX domain and partner manager introductions"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Partner Meeting","accountName":"FlyNas (OutSystems)","clientName":"Ahmed Eissa","pursuitType":"NN","level":"Working Team","designation":"Account Executive","opportunity":"New Flynas oppurchunity via OutSystems","date":"2026-07-27","summary":"Met with OutSystems to understand the oppurchunity and next steps"},{"weekOf":"2026-07-27","name":"Arun","taskType":"New Logo Introduction","accountName":"Wataniya Insurnace Company","clientName":"Nawaf Altowairqi","pursuitType":"NN","level":"Senior Management","designation":"Head of IT Services","opportunity":"OutSystems services oppurchunity","date":"2026-07-27","summary":"Wataniya wants a vendor to take over thier OutSYstems development. High level proposal shared. NDA is being exceuted"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Partner Meeting","accountName":"Raqmiyat","clientName":"Mahesh","pursuitType":"EN","level":"Senior Management","designation":"Director Business Solutions","opportunity":"EN oppurchnuity in ADQCC","date":"2026-07-28","summary":"Meeting to dicuss on the proposal approch for EN in ADQCC"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Partner Meeting","accountName":"Rihal","clientName":"Luke","pursuitType":"Partner Connect","level":"Senior Management","designation":"Director Managed Services","opportunity":"Follow up for renewal PO","date":"2026-07-28","summary":"Follow up meeting to get update on renewal PO and pending payment"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Commercial Negotiation","accountName":"DIFC","clientName":"Deepak Sachdewa","pursuitType":"EN","level":"Senior Management","designation":"CRM Head","opportunity":"Ousystems PS","date":"2026-07-29","summary":"Deal Closed. Awaiting resource onbaording"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Bid/Proposal Defence","accountName":"Computer World","clientName":"Snehal","pursuitType":"EN","level":"Senior Management","designation":"Head of AWS Services","opportunity":"SCE- Phase 2","date":"2026-07-29","summary":"Meeting with partner to share revised propsoal to SCE for phase 2"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Deal Follow up","accountName":"SRIT (CBD)","clientName":"Raja REddy","pursuitType":"EN","level":"C Level","designation":"CEO","opportunity":"CBD - OutSystems Platfrom Upgrade","date":"2026-07-30","summary":"Follow up on the signed SoW. July closure expected"},{"weekOf":"2026-07-27","name":"Arun","taskType":"Existing Account Health Check","accountName":"GEMS Education","clientName":"Vivek","pursuitType":"ER","level":"Senior Management","designation":"Head of Digital service","opportunity":"Follow up on renewal PO","date":"2026-07-30","summary":"Follow up for contract renewal and extension of existing resources."},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Contract / MSA Discussion","accountName":"CMA","clientName":"Ali Alshagrani","pursuitType":"NN","level":"Senior Management","designation":"Procurement Manager","opportunity":"Appian to Kubernetes migration contract closure","date":"2026-07-26","summary":"In person meeting to discuss the contract"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Contract / MSA Discussion","accountName":"CMA","clientName":"Ali Alshagrani","pursuitType":"NN","level":"Senior Management","designation":"Procurement Manager","opportunity":"Appian to Kubernetes migration contract closure","date":"2026-07-27","summary":"Follow up meeting"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Delivery Review","accountName":"CMA","clientName":"Yousef Almoqbel","pursuitType":"NN","level":"Working Team","designation":"PM","opportunity":"Appian to Kubernetes migration contract closure","date":"2026-07-28","summary":"Kick off meeting with the delivery team"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Bid/Proposal Defence","accountName":"Cenomi","clientName":"Binoo Josegh","pursuitType":"ER","level":"Senior Management","designation":"Head of IT","opportunity":"Appian licinces renewal","date":"2026-07-27","summary":"In person meeting- discuss the renewal proposal"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Bid/Proposal Defence","accountName":"Cenomi","clientName":"Binoo Josegh","pursuitType":"ER","level":"Senior Management","designation":"Head of IT","opportunity":"Appian licinces renewal","date":"2026-07-28","summary":"Meeting  with the client including Appian pepole - to confirm the BOQ"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Bid/Proposal Defence","accountName":"Saudia Airlines","clientName":"Alhassan Alhakami","pursuitType":"NN","level":"Working Team","designation":"Infra team","opportunity":"GCP Reselling","date":"2026-07-27","summary":"Discuss the BOQ"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Bid/Proposal Defence","accountName":"Saudia Airlines","clientName":"Alhassan Alhakami and Faisal Alhariri","pursuitType":"NN","level":"C Level","designation":"Infra team+ CTO","opportunity":"GCP Reselling","date":"2026-07-28","summary":"Discuss the BOQ- and change the proposal"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Commercial Negotiation","accountName":"Saudia Airlines","clientName":"Alhassan Alhakami and Faisal Alhariri","pursuitType":"NN","level":"C Level","designation":"Infra team+ CTO","opportunity":"GCP Reselling","date":"2026-07-29","summary":"Discuss the BOQ again- half day meeting"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Delivery Review","accountName":"Aramco Trading","clientName":"Munther and Ali","pursuitType":"EN","level":"C Level","designation":"CIO","opportunity":"GCP- DDE","date":"2026-07-30","summary":"Check the delivery status"},{"weekOf":"2026-07-27","name":"Bashar Hemadany","taskType":"Commercial Negotiation","accountName":"Marafiq","clientName":"Hammadah and his team","pursuitType":"EN","level":"C Level","designation":"CTO- Procurment","opportunity":"Managed Services","date":"2026-07-30","summary":"Technical and commercial proposal clarification meeting"},{"weekOf":"2026-07-27","name":"Gayathry","taskType":"Renewal Discussion/Closures","accountName":"KFH (Bahrain)","clientName":"Tuncay","pursuitType":"ER","level":"C Level","designation":"Digital Transformation Head","opportunity":"Renewal of existing contract","date":"2026-07-27","summary":"Signed SoW submitted and disscussed on the PO issuance"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Internal Review","accountName":"BR APMEA","clientName":"","pursuitType":"","level":"","designation":"","opportunity":"","date":"2026-07-28","summary":""},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Commercial Negotiation","accountName":"Bank Muscat","clientName":"Manesh","pursuitType":"NN","level":"C Level","designation":"Head of Training and Development","opportunity":"Acedemy across 7 tracks","date":"2026-07-28","summary":"Completed the commercial walkthrough. It was well recieved. Awaiting the next steps"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Internal Review","accountName":"Saudia","clientName":"","pursuitType":"","level":"","designation":"","opportunity":"GCP and Azure Reselling","date":"2026-07-28","summary":"Proposal review"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Delivery Review","accountName":"Agthia","clientName":"Saurabh Garg","pursuitType":"","level":"Senior Management","designation":"Head of Apps","opportunity":"MDM and Data Lake","date":"2026-07-28","summary":"Alignment on the detailed SOW"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Commercial Negotiation","accountName":"DIFC","clientName":"Deepak Sachdewa","pursuitType":"EN","level":"Senior Management","designation":"CRM Head","opportunity":"Ousystems PS","date":"2026-07-29","summary":"Deal Closed"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"e& Enterprise","clientName":"Barras","pursuitType":"EN","level":"Senior Management","designation":"Head of BFSI CX","opportunity":"Sales force managed services","date":"2026-07-29","summary":"Good alignment done along with Anas. They have SF capability deck and this needs to be pursued. Decks sent to the partner and next steps planned"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Bid/Proposal Defence","accountName":"Saudia Airlines","clientName":"Alhassam","pursuitType":"NN","level":"Senior Management","designation":"HEad of Cloud infra","opportunity":"GCP and Azure Reselling","date":"2026-07-29","summary":"BAFO needs to be submitted on 30th"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Discovery Meeting","accountName":"DET","clientName":"Lukasz Figarski","pursuitType":"EN","level":"Senior Management","designation":"IT Director","opportunity":"AI use cases","date":"2026-07-30","summary":"15 use cases have been identified. Approach note to be submitted"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"NCGR","clientName":"Dr Osama","pursuitType":"NN","level":"C Level","designation":"Head of EA and Apps/ CIO","opportunity":"GCP Data platforms","date":"2026-07-30","summary":"Intial introduction meeting. They want implement a GCP data foundation to connect to 150 Apps. Next meeting will be done to scope out a POC"},{"weekOf":"2026-07-27","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"GCP","clientName":"Dr Nabeel","pursuitType":"Partner Connect","level":"Senior Management","designation":"Customer Success Engineer","opportunity":"Oveall pipeline discussion","date":"2026-07-30","summary":"Intial introduction meeting. They want implement a GCP data foundation to connect to 150 Apps. Next meeting will be done to scope out a POC"},{"weekOf":"2026-07-27","name":"Shubham","taskType":"Deal Follow up","accountName":"Dubai Media Council","clientName":"Rashid AlMarri","pursuitType":"NN","level":"C Level","designation":"CEO","opportunity":"Service Integration","date":"2026-07-28","summary":"Rashid nominated SPOC from his end and share interview slots for PM and BA profiles."},{"weekOf":"2026-07-27","name":"Shubham","taskType":"Deal Follow up","accountName":"Dubai Media Council","clientName":"Rashid AlMarri","pursuitType":"NN","level":"C Level","designation":"CEO","opportunity":"Service Integration","date":"2026-07-29","summary":"Discussed the next steps after the interview and shared the proposal with them."},{"weekOf":"2026-07-27","name":"Shubham","taskType":"Deal Follow up","accountName":"American University in the Emirates","clientName":"Dr Olena","pursuitType":"NN","level":"Working Team","designation":"Manager - Life long learning","opportunity":"Training","date":"2026-07-30","summary":"Need to submit revised proposal with details of each course."},{"weekOf":"2026-07-27","name":"Shubham","taskType":"Deal Follow up","accountName":"DMCC","clientName":"Dinesh Singh","pursuitType":"NN","level":"Working Team","designation":"Senior Manager - IT","opportunity":"Vendor Portal Onboarding","date":"2026-07-31","summary":"Discussed with the customer related to onboarding on their vendor portal and how to get on the framework agreement."},{"weekOf":"2026-07-27","name":"Shubham","taskType":"Renewal Discussion/Closures","accountName":"DHA","clientName":"Hessa Obaid","pursuitType":"ER","level":"Working Team","designation":"Procurement","opportunity":"Renewal of existing contract","date":"2026-07-31","summary":"Followed the progress related to the SOW and timesheet approvals"},{"weekOf":"2026-07-27","name":"Sweety Jain","taskType":"Discovery Meeting","accountName":"DET","clientName":"Lukasz Figarski","pursuitType":"EN","level":"Senior Management","designation":"Technology Advisor","opportunity":"Data & AI","date":"2026-07-30","summary":"Follow up discussion post CDAO connect about Xebia capabilties & DET roadmap and use cases on data & AI"},{"weekOf":"2026-07-27","name":"Sweety Jain","taskType":"Contract / MSA Discussion","accountName":"DET","clientName":"Vallath Anju Arvind","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"MSA & SOW signature","date":"2026-07-28","summary":"Call with procurement for MSA closure and SOW"},{"weekOf":"2026-07-27","name":"Sweety Jain","taskType":"Deal Follow up","accountName":"Core42","clientName":"Nawaz Khan","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"New Staffing positions","date":"2026-07-28","summary":"Call with procurement regarding update on shared profiles"},{"weekOf":"2026-07-27","name":"Sweety Jain","taskType":"Renewal Discussion/Closures","accountName":"MCB","clientName":"Neetu Soorkia","pursuitType":"ER","level":"Working Team","designation":"Procurment","opportunity":"Existing Renewal","date":"2026-07-31","summary":"Call wih procurement to close the pending SOW and release the PO for month of June"},{"weekOf":"2026-08-03","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Mohammad Omar","pursuitType":"Partner Connect","level":"Senior Management","designation":"Head of Solution Engineering, Microsoft KSA","opportunity":"To be identified","date":"2026-08-03","summary":"1) Identified opportunities for ADO server to ADO service (cloud) migration so that Xebia can be on the preferred partner list once the DC is live in KSA. Xebia to share capabilities around the same\n2) End of August - Broader capabilities overview with the entire solution engineering team and Solution Sales Specialist (20+ people)"},{"weekOf":"2026-08-03","name":"Anas","taskType":"Partner Meeting","accountName":"AWS","clientName":"Alina Selezneva","pursuitType":"Partner Connect","level":"Working Team","designation":"Account Executive","opportunity":"Broader set of opportunities at IHLAD","date":"2026-08-03","summary":"1) Meeting with Paul (Director of IT, Institute of healthier living Abu Dhabi) planned for end of August to scope for broader set of use cases\n2) Introductions at Nextcare Health with broader focus on health insurance"},{"weekOf":"2026-08-03","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Yara Maher, Turki Alrifae","pursuitType":"NN","level":"Working Team","designation":"Cloud and AI SSP Lead","opportunity":"SaudiA cost optimization RFP","date":"2026-08-05","summary":"Guidance from Microsoft on optimization and way forward."},{"weekOf":"2026-08-03","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Dalia Haidar","pursuitType":"Partner Connect","level":"Senior Management","designation":"Aviation Sales Lead","opportunity":"To be identified","date":"2026-08-06","summary":"Capability presentation on airlines, and introductions to Emirates and Riyadh Air account team (MSFT) + Clients"},{"weekOf":"2026-08-03","name":"Anas","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Khload AlShaikh","pursuitType":"Partner Connect","level":"Senior Management","designation":"Cloud and AI SSP, Banking","opportunity":"To be identified","date":"2026-08-06","summary":"Xebia intros, bfsi capabilities overview"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Google","clientName":"Saad Alashri","pursuitType":"Partner Connect","level":"Senior Management","designation":"Account Executive","opportunity":"Marafiq- Managed Service RFP","date":"2026-08-02","summary":"Discuss new oppertunities and Marafiq deleivery status"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Google","clientName":"Hassan Ahmad","pursuitType":"Partner Connect","level":"Working Team","designation":"Pre sales VP","opportunity":"Saudi Energy- GCP","date":"2026-08-02","summary":"New logo deal - Saudi Energy- RFP received"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Cenomi","clientName":"Kunal Singh","pursuitType":"ER","level":"Working Team","designation":"Manager Automation & AI","opportunity":"Renew Appian licences","date":"2026-08-02","summary":"Confirm the new BOQ"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Contract / MSA Discussion","accountName":"CMA","clientName":"Ali Alshagrani","pursuitType":"NN","level":"Senior Management","designation":"Procurement Lead","opportunity":"Appian to Kubernetes migration contract closure","date":"2026-08-02","summary":"Discuss the contract"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Mohammad Omar","pursuitType":"Partner Connect","level":"Senior Management","designation":"Sales Head","opportunity":"Opportunities within KSA","date":"2026-08-03","summary":"Show Xebia capabilities in Microsoft"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Appian","clientName":"Cem Safi","pursuitType":"Partner Connect","level":"Senior Management","designation":"MEA sales Head","opportunity":"Cenomi Appian licences renewal","date":"2026-08-03","summary":"Discuss Cenomi BOQ"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Commercial Negotiation","accountName":"Cenomi","clientName":"Binoo Josegh","pursuitType":"ER","level":"Senior Management","designation":"Head of IT","opportunity":"Cenomi Appian licences renewal","date":"2026-08-03","summary":"Follow up to confirm the new BOQ  and add offshore resources"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Delivery Review","accountName":"Aramco Trading","clientName":"Ali Sayed","pursuitType":"EN","level":"Senior Management","designation":"Data and AI head","opportunity":"EDD project statue","date":"2026-08-04","summary":"Discuss the project progress with the delievery team and open a ned use ase opportunity"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Yara","pursuitType":"NN","level":"Working Team","designation":"Saudia AM","opportunity":"Azure Reselling","date":"2026-08-04","summary":"Discuss Saudi Airlines deal"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Partner Meeting","accountName":"Google","clientName":"Saad Alashri","pursuitType":"Partner Connect","level":"Senior Management","designation":"Account Executive","opportunity":"Discuss Marafiq project progress","date":"2026-08-05","summary":"Meet Marafiq/Google team regarding the project statue"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Marafiq","clientName":"Hammadah and his team","pursuitType":"EN","level":"C Level","designation":"CTO","opportunity":"POC and Production Scope(CR)","date":"2026-08-05","summary":"Discuss the new CR and Managed services. This should be concluded in 2 weeks"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Internal Review","accountName":"Saudi Energy","clientName":"Suhas and Devish","pursuitType":"NN","level":"Working Team","designation":"Presales","opportunity":"Saudi Energy- GCP","date":"2026-08-05","summary":"Follow up the proposal"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"New Logo Introduction","accountName":"Saudi Energy","clientName":"Hassan Ahmad","pursuitType":"NN","level":"Working Team","designation":"Pre sales VP","opportunity":"Saudi Energy- GCP","date":"2026-08-05","summary":"Meeting with Google team to discuss SE deal"},{"weekOf":"2026-08-03","name":"Bashar Hemadany","taskType":"Deal Follow up","accountName":"Saudia Airlines","clientName":"Faisal Alhariri","pursuitType":"NN","level":"C Level","designation":"CIO","opportunity":"GCP Reselling","date":"2026-08-06","summary":"Deal follow up- Travel with Rohan and Steyn"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"National Bank of Fujairah","clientName":"Diaa Moustafa","pursuitType":"NN","level":"C Level","designation":"CIO","opportunity":"Mobile Application Modernization","date":"2026-08-03","summary":"Discussed regarding the Mobile Application moderinization and presented options to NBF to expedite it."},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Existing Account Health Check","accountName":"Agthia","clientName":"Abdulrehman","pursuitType":"EN","level":"C Level","designation":"CIO","opportunity":"Project status meeting","date":"2026-08-04","summary":"This was a kickoff meeting with the CIO where Xebia and Platx came together. I was called to attend the meeting from a leadership perspective"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"Network International","clientName":"Joshi Mathew","pursuitType":"NN","level":"C Level","designation":"Head of digital channels","opportunity":"Architecture modernization","date":"","summary":"Follow up on the last meeting in terms of next steps. A workship will be conducted in coming weeks"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"Marafiq","clientName":"Hammadah and his team","pursuitType":"EN","level":"C Level","designation":"CTO","opportunity":"POC and Production Scope(CR)","date":"2026-08-05","summary":"Discuss the new CR and Managed services. This should be concluded in 2 weeks"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"Google","clientName":"Saad Alashri","pursuitType":"Partner Connect","level":"Senior Management","designation":"Account Executive","opportunity":"Discuss Marafiq project progress","date":"2026-08-05","summary":"Meet Marafiq/Google team regarding the project statue"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"DMCC","clientName":"Dinesh Singh","pursuitType":"NN","level":"Senior Management","designation":"CRM Head","opportunity":"Outsystems project for integration with IDD","date":"2026-08-05","summary":"Discussed with process and operating model. They suggested to create a shared services model as same project is being done with DHA and DIFC. RFp for this will be out in week on 10th Aug"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"Saudia Airlines","clientName":"Faisal Alhariri","pursuitType":"NN","level":"C Level","designation":"CIO","opportunity":"GCP Reselling","date":"2026-08-06","summary":"Deal follow up- approach presentation on our value proposition as GCP and Azure reseller"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"Microsoft","clientName":"Dalia Haidar","pursuitType":"Partner Connect","level":"Senior Management","designation":"Aviation Sales Lead","opportunity":"To be identified","date":"2026-08-06","summary":"Capability presentation on airlines"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Existing Account Health Check","accountName":"DIFC","clientName":"Deepak Sachdewa","pursuitType":"EN","level":"Senior Management","designation":"CRM Head","opportunity":"Ousystems PS","date":"2026-08-06","summary":"Review of the engagement along with Rohit Patel"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Partner Meeting","accountName":"Elitser","clientName":"Keval Parekh","pursuitType":"Partner Connect","level":"C Level","designation":"MD","opportunity":"To be identified","date":"2026-08-07","summary":"Account planning. Elitser does many projects where they need SI expertise"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"Deal Follow up","accountName":"National Bank of Fujairah","clientName":"Manish Garg","pursuitType":"NN","level":"Senior Management","designation":"Head of Apps","opportunity":"Mobile Application Modernization","date":"2026-08-07","summary":"Courtsey meeting on the deal progress"},{"weekOf":"2026-08-03","name":"Rohan Golwalkar","taskType":"New Logo Introduction","accountName":"RAKEZ","clientName":"Walid","pursuitType":"NN","level":"C Level","designation":"CIO","opportunity":"Sales force managed services","date":"2026-08-07","summary":"Discussion on capabilities and engagement model"},{"weekOf":"2026-08-03","name":"Shubham","taskType":"Deal Follow up","accountName":"National Bank of Fujairah","clientName":"Diaa Moustafa","pursuitType":"NN","level":"C Level","designation":"CIO","opportunity":"Mobile Application Modernization","date":"2026-08-03","summary":"Discussed regarding the Mobile Application moderinization and presented options to NBF to expedite it."},{"weekOf":"2026-08-03","name":"Shubham","taskType":"Deal Follow up","accountName":"DMCC","clientName":"Abhishek Tripathy","pursuitType":"NN","level":"Senior Management","designation":"Head of IT","opportunity":"Outsystems Opportunity","date":"2026-08-05","summary":"Discussed regarding the potential collaboration and next steps for RFP next week"},{"weekOf":"2026-08-03","name":"Shubham","taskType":"Deal Follow up","accountName":"Dubai Media Council","clientName":"Rashid AlMarri","pursuitType":"NN","level":"C Level","designation":"CEO","opportunity":"Service Integration","date":"2026-08-04","summary":"Introduced Xebia management and discussed how we can build this opportunity further."},{"weekOf":"2026-08-03","name":"Shubham","taskType":"Deal Follow up","accountName":"National Bank of Fujairah","clientName":"Manish Garg","pursuitType":"NN","level":"Senior Management","designation":"Head of engineering","opportunity":"Mobile Application Modernization","date":"2026-08-06","summary":"Final proposal discussion with Manish for CIO review"},{"weekOf":"2026-08-03","name":"Shubham","taskType":"Deal Follow up","accountName":"American University in the Emirates","clientName":"Dr Olena","pursuitType":"NN","level":"Working Team","designation":"Manager of Lifelong Learning","opportunity":"Academy","date":"2026-08-05","summary":"Update on the proposal shared. Our proposal is with AUE committee now and AUE IT team will speak to us soon regarding their current requirement."},{"weekOf":"2026-08-03","name":"Sweety Jain","taskType":"Contract / MSA Discussion","accountName":"DET","clientName":"Vallath Anju Arvind","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"MSA & SOW signature","date":"2026-08-03","summary":"Revised documents discussed  and follow up call done for signature process"},{"weekOf":"2026-08-03","name":"Sweety Jain","taskType":"Contract / MSA Discussion","accountName":"DET","clientName":"Vallath Anju Arvind","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"MSA & SOW signature","date":"2026-08-04","summary":"Revised documents discussed  and follow up call done for signature process"},{"weekOf":"2026-08-03","name":"Sweety Jain","taskType":"Deal Follow up","accountName":"Core42","clientName":"Nawaz Khan","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"New Staffing positions","date":"2026-08-05","summary":"Interview done for 2 candidates, feedback and follow up call on other shared profiles."},{"weekOf":"2026-08-03","name":"Sweety Jain","taskType":"Renewal Discussion/Closures","accountName":"MCB","clientName":"Neetu Soorkia","pursuitType":"ER","level":"Working Team","designation":"Procurment","opportunity":"Existing Renewal","date":"2026-08-05","summary":"Call wih procurement to plan meeting for my travel"},{"weekOf":"2026-08-03","name":"Sweety Jain","taskType":"Existing Account Health Check","accountName":"Core42","clientName":"Giana Phillip","pursuitType":"EN","level":"Working Team","designation":"Procurement Manager","opportunity":"Feedback and payment of pending invoice","date":"2026-08-06","summary":"Call with Giana to discuss on pending payment and feedback of existing candidate"}]
;

const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const todayISO = () => toISODate(new Date());
const mondayOf = (isoDate) => {
  const d = new Date(isoDate + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
};
const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toISODate(d);
};
const fmtDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateShort = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—";
const fmtWeek = (iso) => {
  const start = new Date(iso + "T00:00:00");
  const end = new Date(start); end.setDate(end.getDate() + 4); // Friday — working days only
  const opts = { day: "2-digit", month: "short" };
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)}`;
};
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/* Exports entries as a real .xlsx file the user can open in Excel/Sheets —
   this is the authoritative, portable copy of the data, independent of
   the app's own storage. xlsx (SheetJS) is a large library that doesn't
   tree-shake, so it's dynamically imported here instead of at the top of
   the file — nobody pays for it in the initial bundle unless they
   actually click an export button. */
async function exportEntriesToExcel(entries, label) {
  const XLSX = await import("xlsx");
  const rows = entries.map((e) => ({
    "Week Of": e.weekOf || "",
    "Date": e.date || "",
    "Seller / CP": e.name || "",
    "Task Type": e.taskType || "",
    "Account Name": e.accountName || "",
    "Client Name": e.clientName || "",
    "Pursuit Type": e.pursuitType || "",
    "Level": e.level || "",
    "Designation": e.designation || "",
    "Opportunity": e.opportunity || "",
    "Discussion Summary": e.summary || "",
    "Logged At": e.loggedAt || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 26 }, { wch: 26 }, { wch: 20 },
    { wch: 12 }, { wch: 16 }, { wch: 26 }, { wch: 30 }, { wch: 50 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Detailed Tasks");
  const stamp = todayISO();
  XLSX.writeFile(wb, `MEA_Effort_Log_${label}_${stamp}.xlsx`);
}

/* ------------------------------------------------------------------ */
/* Local (per-device) storage — only the "who am I logged in as" flag  */
/* lives here. Everything shared across the team lives in Firestore    */
/* (see src/lib/store.js) so it syncs live across laptops and phones.  */
/* ------------------------------------------------------------------ */
const USER_KEY = "sales-effort-current-user";

/* ------------------------------------------------------------------ */
/* Root                                                                 */
/* ------------------------------------------------------------------ */
export default function App() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState(null);
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(DEFAULT_TEAM);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("form");
  const [toast, setToast] = useState(null);
  const [dashWeek, setDashWeek] = useState(null);
  const [detailWeek, setDetailWeek] = useState(null);
  const [detailSeller, setDetailSeller] = useState(ALL_SELLERS);
  const [detailQuery, setDetailQuery] = useState("");

  useEffect(() => {
    const savedUser = (() => {
      try { return localStorage.getItem(USER_KEY); } catch { return null; }
    })();
    if (savedUser) {
      setUser(savedUser);
      setView(savedUser === LEADERSHIP_NAME ? "dashboard" : "form");
    }

    // First run against a fresh Firestore project only — seeds the
    // original workbook's historical rows. No-ops once any entry exists.
    seedIfEmpty(SEED_ENTRIES).catch(() => {});

    const describeError = (err) =>
      err.code === "permission-denied"
        ? "Firestore is rejecting reads/writes (permission-denied). The security rules probably haven't been published yet — see firestore.rules in the project."
        : `Couldn't connect to Firestore: ${err.message}`;

    // Entries can be a large, slow-to-fully-sync collection, especially on
    // constrained connections — don't make people wait on it just to see
    // the login screen. It streams in and updates the UI whenever it's
    // ready; only the tiny "team" doc gates the boot spinner.
    const unsubEntries = subscribeEntries(
      (list) => setEntries(list),
      (err) => { setBootError(describeError(err)); setBooting(false); }
    );
    let sawFirstTeamSnapshot = false;
    const unsubTeam = subscribeTeam(
      (members) => {
        setTeam(members && members.length ? members : DEFAULT_TEAM);
        if (!sawFirstTeamSnapshot) {
          sawFirstTeamSnapshot = true;
          setBooting(false);
        }
      },
      (err) => { setBootError(describeError(err)); setBooting(false); }
    );

    return () => { unsubEntries(); unsubTeam(); };
  }, []);

  const showToast = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const handleLogin = (name) => {
    setUser(name);
    setView(name === LEADERSHIP_NAME ? "dashboard" : "form");
    try { localStorage.setItem(USER_KEY, name); } catch {}
    if (name !== LEADERSHIP_NAME && !team.includes(name)) {
      addTeamMember(name).catch(() => {});
    }
  };

  const handleSwitchUser = () => {
    setUser(null);
    try { localStorage.removeItem(USER_KEY); } catch {}
  };

  /* Firestore applies writes to the local cache (and to every onSnapshot
     listener, including this tab's own) the moment they're issued — the
     promise these calls return only settles once the server round-trip
     acknowledges the write, which can hang for a long time on flaky or
     restrictive connections. Blocking the UI on that round-trip meant the
     "Saving…" button could freeze for a minute+ even though the write had
     already gone through locally. So: don't await it. Let the form/button
     unblock immediately, and surface the toast whenever the round-trip
     actually settles (success or failure) in the background. */
  const handleAddEntry = async (entry) => {
    const withMeta = { ...entry, id: uid(), loggedAt: new Date().toISOString() };
    fsAddEntry(withMeta).then(
      () => showToast("Activity logged.", "ok"),
      () => showToast("Couldn't save — check your connection and try again.", "err")
    );
  };

  const handleUpdateEntry = async (id, updates) => {
    fsUpdateEntry(id, updates).then(
      () => showToast("Entry updated.", "ok"),
      () => showToast("Couldn't save the update — check your connection.", "err")
    );
  };

  const handleDeleteEntry = async (id) => {
    fsDeleteEntry(id).then(
      () => showToast("Entry deleted.", "ok"),
      () => showToast("Couldn't save the deletion — check your connection.", "err")
    );
  };

  if (booting) {
    return (
      <div style={{ ...S.page, alignItems: "center", justifyContent: "center", display: "flex" }}>
        <FontLoader />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 className="animate-spin" size={22} color={C.gold} />
          <BootMessage />
        </div>
      </div>
    );
  }

  if (bootError) {
    return (
      <div style={{ ...S.page, alignItems: "center", justifyContent: "center", display: "flex", padding: 24 }}>
        <FontLoader />
        <div style={{ maxWidth: 420, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24, textAlign: "center" }}>
          <AlertCircle size={22} color={C.coral} style={{ marginBottom: 10 }} />
          <div className="disp" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Can't load data</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{bootError}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <FontLoader />
      {!user ? (
        <LoginGate team={team} onLogin={handleLogin} />
      ) : (
        <Shell user={user} view={view} setView={setView} onSwitchUser={handleSwitchUser} entries={entries}>
          {view === "form" ? (
            <LogForm user={user} team={team} entries={entries} onSubmit={handleAddEntry} readOnly={isLeadership(user)} />
          ) : view === "dashboard" ? (
            <Dashboard entries={entries} team={team} selectedWeek={dashWeek} setSelectedWeek={setDashWeek} />
          ) : (
            <DetailedActivity
              entries={entries}
              user={user}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              selectedWeek={detailWeek}
              setSelectedWeek={setDetailWeek}
              seller={detailSeller}
              setSeller={setDetailSeller}
              query={detailQuery}
              setQuery={setDetailQuery}
            />
          )}
        </Shell>
      )}
      {toast && <Toast msg={toast.msg} kind={toast.kind} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const C = {
  ink: "#10233F",
  ink2: "#22385C",
  paper: "#F5F6F5",
  card: "#FFFFFF",
  line: "#E3E6E2",
  muted: "#6B7686",
  gold: "#B8862E",
  goldSoft: "#F2E4C8",
  teal: "#1F7A6C",
  coral: "#C4512B",
};

const S = {
  page: { minHeight: "100%", background: C.paper, fontFamily: "'Inter', sans-serif", color: C.ink, WebkitFontSmoothing: "antialiased" },
};

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
      * { box-sizing: border-box; }
      .disp { font-family: 'Space Grotesk', sans-serif; }
      .mono { font-family: 'IBM Plex Mono', monospace; }
      input, select, textarea, button { font-family: 'Inter', sans-serif; }
      input:focus, select:focus, textarea:focus, button:focus-visible {
        outline: 2px solid ${C.gold}; outline-offset: 1px;
      }
      ::placeholder { color: #A3ABB5; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

      /* Mobile: icon-only tabs so the header doesn't overflow on phone widths */
      .app-name { overflow: hidden; text-overflow: ellipsis; max-width: 46vw; }
      @media (max-width: 640px) {
        .tab-label { display: none; }
        .tab-btn { padding: 9px 11px !important; }
        .header-user-meta { display: none; }
        .header-inner { padding: 12px 14px !important; }
        .main-inner { padding: 16px 14px 48px !important; }
        .app-name { max-width: 30vw; }
      }
      /* Extra-narrow phones: drop the app name text next to the logo */
      @media (max-width: 400px) {
        .app-name { display: none; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Login gate — pick your name from the dropdown, hit Log in.          */
/* ------------------------------------------------------------------ */
const NEW_PERSON = "__new__";

function LoginGate({ team, onLogin }) {
  const roster = useMemo(() => {
    const merged = [...new Set([...team.filter((n) => n !== LEADERSHIP_NAME), LEADERSHIP_NAME])];
    return merged;
  }, [team]);
  const [selection, setSelection] = useState(roster[0] || "");
  const [newName, setNewName] = useState("");

  useEffect(() => { if (!selection && roster.length) setSelection(roster[0]); }, [roster]); // eslint-disable-line

  const isNew = selection === NEW_PERSON;
  const submit = () => {
    if (isNew) { if (newName.trim()) onLogin(newName.trim()); }
    else if (selection) onLogin(selection);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, justifyContent: "center" }}>
          <XebiaLogo size={34} />
          <div className="disp" style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2 }}>MEA Sales Effort Tracker</div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24, boxShadow: "0 1px 2px rgba(16,35,63,0.04)" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 7, letterSpacing: 0.2 }}>YOUR NAME</label>
          <div style={{ position: "relative" }}>
            <select
              autoFocus
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              style={{ ...inputStyle, paddingRight: 30, appearance: "none" }}
            >
              {roster.map((n) => <option key={n} value={n}>{n}</option>)}
              <option value={NEW_PERSON}>+ New person (type your name)</option>
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 12, top: 14, pointerEvents: "none", color: C.muted }} />
          </div>

          {isNew && (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Priya Nair"
              style={{ ...inputStyle, marginTop: 10 }}
              onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) submit(); }}
            />
          )}

          <button onClick={submit} disabled={isNew && !newName.trim()} style={{ ...btnPrimary, width: "100%", marginTop: 14, opacity: isNew && !newName.trim() ? 0.5 : 1 }}>
            Log in
          </button>
          {selection === LEADERSHIP_NAME && (
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 12, lineHeight: 1.5 }}>
              Logs in straight to the Summary Dashboard — Log Tasks is view-only for this login.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, size = 28 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const hue = Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue}, 38%, 88%)`, color: `hsl(${hue}, 45%, 30%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700,
    }}>
      {initials}
    </div>
  );
}

/* Xebia's logo, embedded directly as a data URI so it renders with zero
   network dependency — no external service, nothing that can go down or
   get blocked. Sized by height; width follows the logo's own aspect
   ratio rather than being forced into a square badge. */
const XEBIA_LOGO_DATA_URI = "data:image/jpeg;base64,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";
function XebiaLogo({ size = 30 }) {
  return (
    <div style={{ height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#fff", borderRadius: 7, padding: "0 8px" }}>
      <img src={XEBIA_LOGO_DATA_URI} alt="Xebia" style={{ height: size * 0.62, width: "auto", objectFit: "contain", display: "block" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shell (header + tabs)                                               */
/* ------------------------------------------------------------------ */
function Shell({ user, view, setView, onSwitchUser, entries, children }) {
  const myCount = entries.filter((e) => e.name === user).length;
  return (
    <div>
      <header style={{ background: C.ink, color: "#fff" }}>
        <div className="header-inner" style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <XebiaLogo size={30} />
            <div className="disp app-name" style={{ fontSize: 15.5, fontWeight: 700, whiteSpace: "nowrap" }}>MEA Sales Effort Tracker</div>
          </div>

          <nav style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.07)", padding: 4, borderRadius: 10 }}>
            <TabBtn active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutDashboard size={14} />} label="Summary Dashboard" />
            <TabBtn active={view === "detail"} onClick={() => setView("detail")} icon={<ListChecks size={14} />} label="Detailed Tasks" />
            <TabBtn active={view === "form"} onClick={() => setView("form")} icon={<PenSquare size={14} />} label="Log Tasks" />
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="header-user-meta" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user}</div>
              <div style={{ fontSize: 10.5, color: "#9FB0C8" }}>{myCount} logged total</div>
            </div>
            <Avatar name={user} size={30} />
            <button onClick={onSwitchUser} title="Switch user" style={{ background: "none", border: "none", color: "#9FB0C8", cursor: "pointer", padding: 6, display: "flex" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="main-inner" style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 60px" }}>{children}</main>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, disabled, title }) {
  return (
    <button
      className="tab-btn"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title || label}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 7,
        border: "none", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        background: active ? "#fff" : "transparent",
        color: disabled ? "#5C6B85" : active ? C.ink : "#C7D2E3",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon} <span className="tab-label">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Log form                                                             */
/* ------------------------------------------------------------------ */
const emptyForm = (user) => ({
  name: user,
  date: todayISO(),
  weekOf: mondayOf(todayISO()),
  taskType: "",
  accountName: "",
  clientName: "",
  pursuitType: "",
  level: "",
  designation: "",
  opportunity: "",
  summary: "",
});

/* All Mondays from the start of July through next week, plus any earlier
   week that already has logged data — so the dropdown always covers the
   full history and lets people log ahead for next week too. */
function buildWeekOptions(entries) {
  const today = todayISO();
  const thisWeek = mondayOf(today);
  const nextWeek = addDays(thisWeek, 7);
  const julyStart = mondayOf(`${new Date(today + "T00:00:00").getFullYear()}-07-01`);
  const dataWeeks = weeksAvailable(entries);
  const earliest = dataWeeks.length && dataWeeks[dataWeeks.length - 1] < julyStart
    ? dataWeeks[dataWeeks.length - 1]
    : julyStart;
  const opts = [];
  let cursor = earliest;
  while (cursor <= nextWeek) {
    opts.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return opts.reverse(); // most recent / upcoming first
}

function LogForm({ user, team, entries, onSubmit, readOnly }) {
  const [form, setForm] = useState(emptyForm(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [weekTouched, setWeekTouched] = useState(false);
  const canPickSeller = canLogForOthers(user);
  const sellerOptions = useMemo(
    () => [...new Set([...(team || DEFAULT_TEAM).filter((n) => n !== LEADERSHIP_NAME), user])].sort((a, b) => a.localeCompare(b)),
    [team, user]
  );

  const weekOptions = useMemo(() => buildWeekOptions(entries), [entries]);
  const thisWeek = mondayOf(todayISO());
  const nextWeek = addDays(thisWeek, 7);
  const frozen = readOnly ? { background: "#F7F8F6", color: C.muted, cursor: "not-allowed" } : {};

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleDateChange = (v) => {
    setForm((f) => (weekTouched ? { ...f, date: v } : { ...f, date: v, weekOf: mondayOf(v) }));
  };
  const handleWeekChange = (v) => {
    setWeekTouched(true);
    set("weekOf", v);
  };

  const validate = () => {
    const req = ["name", "date", "weekOf", "taskType", "accountName", "clientName", "pursuitType", "level"];
    const errs = {};
    req.forEach((k) => { if (!form[k]) errs[k] = true; });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
    setForm(emptyForm(user));
    setWeekTouched(false);
  };

  return (
    <div>
      <SectionHeading eyebrow="New entry" title="Log Task" sub="One row per meeting, call or touchpoint — this feeds straight into the weekly dashboard." />

      {readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#F0F3F8", border: `1px solid #D7DEE9`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: C.ink2 }}>
          <LayoutDashboard size={15} style={{ flexShrink: 0 }} />
          This form is view-only for leadership logins — inputs are frozen and nothing can be submitted from here. Use Summary Dashboard or Detailed Tasks to review what the team has logged.
        </div>
      )}

      {canPickSeller && !readOnly && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#F2E9D8", border: `1px solid #E3CE9C`, borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#7A5A16" }}>
          <ShieldCheck size={15} style={{ flexShrink: 0 }} />
          You can log this entry on behalf of anyone on the team — pick who it's for below.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 24 }}>
        <div style={{ marginBottom: 18 }}>
          <Field label="Week of" error={errors.weekOf} style={{ maxWidth: 280 }}>
            <div style={{ position: "relative" }}>
              <select
                value={form.weekOf}
                disabled={readOnly}
                onChange={(e) => handleWeekChange(e.target.value)}
                style={{ ...inputStyle, paddingRight: 30, appearance: "none", ...(errors.weekOf ? { borderColor: C.coral } : {}), ...frozen }}
              >
                {weekOptions.map((w) => (
                  <option key={w} value={w}>
                    {fmtDateShort(w)} – {fmtDateShort(addDays(w, 4))}
                    {w === thisWeek ? " · Current week" : w === nextWeek ? " · Upcoming" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: "absolute", right: 10, top: 12, pointerEvents: "none", color: C.muted }} />
            </div>
          </Field>
        </div>

        {canPickSeller ? (
          <div style={{ marginBottom: 18 }}>
            <Field label="Seller / CP" error={errors.name} style={{ maxWidth: 280 }}>
              <div style={{ position: "relative" }}>
                <select
                  value={form.name}
                  disabled={readOnly}
                  onChange={(e) => set("name", e.target.value)}
                  style={{ ...inputStyle, paddingRight: 30, appearance: "none", ...(errors.name ? { borderColor: C.coral } : {}), ...frozen }}
                >
                  {sellerOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 10, top: 12, pointerEvents: "none", color: C.muted }} />
              </div>
            </Field>
          </div>
        ) : (
          <div style={{ marginBottom: 18, fontSize: 12.5, color: C.muted }}>
            Logging as <b style={{ color: C.ink }}>{user}</b>
          </div>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <Field label="Date of interaction" error={errors.date} style={{ flex: "1 1 220px", maxWidth: 280 }}>
            <input type="date" value={form.date} disabled={readOnly} onChange={(e) => handleDateChange(e.target.value)} style={{ ...inputStyle, ...frozen }} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <Field label="Task type" error={errors.taskType} style={{ flex: "1 1 220px" }}>

            <select value={form.taskType} disabled={readOnly} onChange={(e) => set("taskType", e.target.value)} style={{ ...inputStyle, ...frozen }}>
              <option value="">Select…</option>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Pursuit type" error={errors.pursuitType} style={{ flex: "1 1 160px" }}>
            <select value={form.pursuitType} disabled={readOnly} onChange={(e) => set("pursuitType", e.target.value)} style={{ ...inputStyle, ...frozen }}>
              <option value="">Select…</option>
              {PURSUIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Level" error={errors.level} style={{ flex: "1 1 160px" }}>
            <select value={form.level} disabled={readOnly} onChange={(e) => set("level", e.target.value)} style={{ ...inputStyle, ...frozen }}>
              <option value="">Select…</option>
              {LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <Field label="Account name" error={errors.accountName} style={{ flex: "1 1 220px" }}>
            <input value={form.accountName} disabled={readOnly} onChange={(e) => set("accountName", e.target.value)} placeholder="e.g. Dubai Airports" style={{ ...inputStyle, ...frozen }} />
          </Field>
          <Field label="Client name" error={errors.clientName} style={{ flex: "1 1 220px" }}>
            <input value={form.clientName} disabled={readOnly} onChange={(e) => set("clientName", e.target.value)} placeholder="e.g. Nour Noufal" style={{ ...inputStyle, ...frozen }} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <Field label="Designation" style={{ flex: "1 1 220px" }}>
            <input value={form.designation} disabled={readOnly} onChange={(e) => set("designation", e.target.value)} placeholder="e.g. Chief Technology Officer" style={{ ...inputStyle, ...frozen }} />
          </Field>
          <Field label="Opportunity" style={{ flex: "1 1 220px" }}>
            <input value={form.opportunity} disabled={readOnly} onChange={(e) => set("opportunity", e.target.value)} placeholder="e.g. Member Portal Migration" style={{ ...inputStyle, ...frozen }} />
          </Field>
        </div>

        <Field label="Discussion summary" style={{ marginBottom: 22 }}>
          <textarea
            value={form.summary}
            disabled={readOnly}
            onChange={(e) => set("summary", e.target.value)}
            placeholder="What was discussed, decided, or the next step…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", ...frozen }}
          />
        </Field>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {readOnly ? (
            <div style={{ fontSize: 12.5, color: C.muted }}>Logging in as leadership — this form doesn't submit.</div>
          ) : Object.keys(errors).length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.coral, fontSize: 12.5, fontWeight: 600 }}>
              <AlertCircle size={14} /> Fill the required fields highlighted above.
            </div>
          ) : <div />}
          <button type="submit" disabled={saving || readOnly} style={{ ...btnPrimary, minWidth: 160, opacity: saving || readOnly ? 0.5 : 1, cursor: readOnly ? "not-allowed" : "pointer" }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Saving…" : "Log Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, error, style }) {
  return (
    <div style={{ flex: 1, minWidth: 0, ...style }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: error ? C.coral : C.muted, marginBottom: 6, letterSpacing: 0.2 }}>
        {label.toUpperCase()}
      </label>
      {React.cloneElement(children, {
        style: { ...children.props.style, ...(error ? { borderColor: C.coral } : {}) },
      })}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.line}`,
  fontSize: 14, color: C.ink, background: "#fff",
};
const btnPrimary = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  background: C.ink, color: "#fff", border: "none", borderRadius: 9,
  padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const btnGhost = {
  background: "transparent", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 9,
  padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
};

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 1.2, color: C.gold, fontWeight: 600, marginBottom: 6 }}>{eyebrow.toUpperCase()}</div>
      <div className="disp" style={{ fontSize: 23, fontWeight: 700, letterSpacing: -0.3 }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, color: C.muted, marginTop: 4, maxWidth: 620 }}>{sub}</div>}
    </div>
  );
}

/* First load on a given device/browser has to fetch everything fresh —
   every load after that is close to instant, served from that device's
   local cache. Without an explanation the first, slower load just looks
   broken, so make that one-time cost explicit. */
function BootMessage() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ textAlign: "center", maxWidth: 280 }}>
      <div style={{ fontSize: 13, color: C.muted }}>Loading…</div>
      {slow && (
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>
          First time on this device — this can take a little longer.
          It'll load instantly from here on.
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast                                                                */
/* ------------------------------------------------------------------ */
function Toast({ msg, kind }) {
  return (
    <div style={{
      position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)",
      background: kind === "ok" ? C.ink : C.coral, color: "#fff", padding: "10px 18px",
      borderRadius: 10, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)", zIndex: 50,
    }}>
      {kind === "ok" ? <Check size={15} /> : <AlertCircle size={15} />} {msg}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */
const ALL_TIME = "all";
const ALL_SELLERS = "all-sellers";

function weeksAvailable(entries) {
  return [...new Set(entries.map((e) => e.weekOf).filter(Boolean))].sort().reverse();
}

function computeRange(selectedWeek, entries) {
  if (selectedWeek === ALL_TIME) {
    if (!entries.length) { const start = mondayOf(todayISO()); return { start, end: addDays(start, 6) }; }
    const dates = entries.map((e) => e.date).filter(Boolean).sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }
  return { start: selectedWeek, end: addDays(selectedWeek, 6) };
}

/* Which week an entry belongs to is whatever "Week of" was chosen when it
   was logged (e.weekOf) — not a date range recomputed from the calendar.
   That's the field people explicitly set, so it's the source of truth for
   grouping, and it sidesteps any ambiguity about where weekends fall. */
function filterByWeek(entries, selectedWeek) {
  return selectedWeek === ALL_TIME ? entries : entries.filter((e) => e.weekOf === selectedWeek);
}

function Dashboard({ entries, team, selectedWeek, setSelectedWeek }) {
  const weeks = useMemo(() => weeksAvailable(entries), [entries]);
  const defaultWeek = useMemo(() => {
    const thisWeek = mondayOf(todayISO());
    if (weeks.includes(thisWeek)) return thisWeek;
    return weeks[0] || thisWeek;
  }, [weeks]);
  const effectiveWeek = selectedWeek || defaultWeek;

  const range = computeRange(effectiveWeek, entries);
  const filtered = useMemo(
    () => filterByWeek(entries, effectiveWeek),
    [entries, effectiveWeek]
  );

  const activeSellers = new Set(filtered.map((e) => e.name)).size;
  const uniqueAccounts = new Set(filtered.map((e) => e.accountName).filter(Boolean));
  const uniqueClients = new Set(filtered.map((e) => e.clientName).filter(Boolean));
  const uniquePartners = new Set(filtered.filter((e) => e.pursuitType === "Partner Connect").map((e) => e.accountName).filter(Boolean));
  const cLevelEntries = filtered.filter((e) => e.level === "C Level");
  const cLevelAccounts = new Set(cLevelEntries.map((e) => e.accountName).filter(Boolean));

  const taskTypeCounts = useMemo(() => {
    const m = {};
    filtered.forEach((e) => { if (e.taskType) m[e.taskType] = (m[e.taskType] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const pursuitCounts = useMemo(() => {
    const m = {};
    filtered.forEach((e) => { if (e.pursuitType) m[e.pursuitType] = (m[e.pursuitType] || 0) + 1; });
    return PURSUIT_TYPES.map((p) => ({ name: p, count: m[p] || 0 })).filter((d) => d.count > 0);
  }, [filtered]);

  const sellerLevel = useMemo(() => {
    const m = {};
    filtered.forEach((e) => {
      if (!m[e.name]) m[e.name] = { "C Level": 0, "Senior Management": 0, "Working Team": 0, total: 0 };
      if (e.level) m[e.name][e.level] = (m[e.name][e.level] || 0) + 1;
      m[e.name].total += 1;
    });
    return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
  }, [filtered]);

  const newLogoEntries = useMemo(() => filtered.filter((e) => e.taskType === "New Logo Introduction"), [filtered]);
  const partnerEntries = useMemo(() => filtered.filter((e) => e.pursuitType === "Partner Connect"), [filtered]);
  const otherEntries = useMemo(
    () => filtered.filter((e) => e.taskType !== "New Logo Introduction" && e.pursuitType !== "Partner Connect"),
    [filtered]
  );

  const newLogoSummary = useMemo(() => buildCategorySummary("newlogo", newLogoEntries), [newLogoEntries]);
  const partnerSummary = useMemo(() => buildCategorySummary("partner", partnerEntries), [partnerEntries]);
  const otherSummary = useMemo(() => buildCategorySummary("other", otherEntries), [otherEntries]);

  const spanDays = (new Date(range.end) - new Date(range.start)) / 86400000 + 1;
  const trend = useMemo(() => {
    if (spanDays <= 15) {
      const days = [];
      for (let i = 0; i < spanDays; i++) days.push(addDays(range.start, i));
      return days.map((iso) => ({ label: fmtDateShort(iso), count: filtered.filter((e) => e.date === iso).length }));
    }
    const weeks = [...new Set(filtered.map((e) => e.weekOf))].sort();
    return weeks.map((w) => ({ label: fmtDateShort(w), count: filtered.filter((e) => e.weekOf === w).length }));
  }, [filtered, range.start, spanDays]);
  const maxTrend = Math.max(1, ...trend.map((d) => d.count));

  const recent = [...filtered].sort((a, b) => (b.loggedAt || b.date || "").localeCompare(a.loggedAt || a.date || "")).slice(0, 8);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <SectionHeading eyebrow="Overview" title="Team dashboard" sub="Live rollup of every activity the team has logged." />
        <RangePicker selectedWeek={effectiveWeek} setSelectedWeek={setSelectedWeek} weeks={weeks} />
      </div>

      {!filtered.length ? (
        <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 14, padding: 40, textAlign: "center", color: C.muted, fontSize: 13.5 }}>
          No entries logged in this range yet.
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
            <Kpi label="Total activities" value={filtered.length} icon={<Radio size={15} />} />
            <Kpi label="Active sellers" value={activeSellers} sub={`of ${team.length} on the team`} icon={<Users size={15} />} />
            <Kpi label="Unique accounts" value={uniqueAccounts.size} icon={<Building2 size={15} />} />
            <Kpi label="Unique clients met" value={uniqueClients.size} icon={<Users size={15} />} />
            <Kpi label="Unique partners met" value={uniquePartners.size} icon={<Handshake size={15} />} />
            <Kpi label="Top activity" value={taskTypeCounts[0]?.name || "—"} isText icon={<TrendingUp size={15} />} />
          </div>

          {/* Three-heading executive summary */}
          <div style={{ marginBottom: 10 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: 1, color: C.gold, fontWeight: 700, marginBottom: 3 }}>
              SUMMARY · {effectiveWeek === ALL_TIME ? "All time" : `Week of ${fmtDateShort(range.start)}`}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>What to tell leadership — in three lines.</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 16, alignItems: "stretch" }}>
            <ExecSummaryCard icon={<Sparkles size={15} />} title="New logos" accent={C.teal} data={newLogoSummary} />
            <ExecSummaryCard icon={<Handshake size={15} />} title="Partner connect" accent={C.gold} data={partnerSummary} />
            <ExecSummaryCard icon={<ListChecks size={15} />} title="Other activities" accent={C.ink2} data={otherSummary} />
          </div>

          {/* Trend strip */}
          <Card title={spanDays <= 15 ? "Daily activity" : "Weekly activity"} sub={`${filtered.length} activities across ${trend.length} ${spanDays <= 15 ? "day(s)" : "week(s)"}`} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: trend.length > 20 ? 3 : 10, height: 64, overflowX: trend.length > 20 ? "auto" : "visible" }}>
              {trend.map((d, i) => (
                <div key={i} style={{ flex: trend.length > 20 ? "0 0 18px" : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div className="mono" style={{ fontSize: 10, marginBottom: 4, color: C.muted, opacity: d.count ? 1 : 0.3 }}>{d.count || ""}</div>
                  <div style={{
                    width: "100%", maxWidth: 22, borderRadius: 4,
                    height: `${Math.max(4, (d.count / maxTrend) * 34)}px`,
                    background: d.count ? C.gold : C.line,
                  }} />
                  <div style={{ color: C.muted, fontSize: 9.5, marginTop: 6, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginBottom: 16 }}>
            <PivotTable
              title="Activities split"
              sub="Count of task type"
              rows={taskTypeCounts}
              rowLabel="Task type"
              accent={C.gold}
            />
            <PivotTable
              title="Pursuit type split"
              sub="Overall in range"
              rows={pursuitCounts}
              rowLabel="Pursuit type"
              colorMap={PURSUIT_COLOR}
            />
          </div>

          {/* Seller x Level pivot */}
          <Card title="Seller / CP level connect summary" sub="Connects by seller, split by stakeholder level" style={{ marginBottom: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>Seller / CP</th>
                    {LEVELS.map((l) => <th key={l} style={{ ...th, textAlign: "right" }}>{l}</th>)}
                    <th style={{ ...th, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerLevel.map(([name, row]) => (
                    <tr key={name}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={name} size={22} /> {name}
                        </div>
                      </td>
                      {LEVELS.map((l) => (
                        <td key={l} style={{ ...td, textAlign: "right", color: row[l] ? C.ink : "#C6CBD2" }}>{row[l] || "–"}</td>
                      ))}
                      <td style={{ ...td, textAlign: "right", fontWeight: 700 }} className="mono">{row.total}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ ...td, fontWeight: 700, borderTop: `2px solid ${C.ink}` }}>Grand total</td>
                    {LEVELS.map((l) => (
                      <td key={l} style={{ ...td, textAlign: "right", fontWeight: 700, borderTop: `2px solid ${C.ink}` }} className="mono">
                        {sellerLevel.reduce((s, [, r]) => s + (r[l] || 0), 0)}
                      </td>
                    ))}
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, borderTop: `2px solid ${C.ink}` }} className="mono">{filtered.length}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent activity */}
          <Card title="Recent entries" sub={`Latest ${recent.length} in range`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recent.map((e) => (
                <div key={e.id || `${e.name}-${e.date}-${e.accountName}`} style={{ display: "flex", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${C.line}` }}>
                  <Avatar name={e.name} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{e.name}</span>
                      {e.level && <Tag color={LEVEL_COLOR[e.level]}>{e.level}</Tag>}
                      <span style={{ color: C.muted, fontSize: 12 }}>· {e.taskType}</span>
                      <span className="mono" style={{ color: C.muted, fontSize: 11, marginLeft: "auto" }}>{fmtDate(e.date)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.ink2 }}>
                      <b>{e.accountName}</b>{e.clientName ? ` · ${e.clientName}` : ""}{e.designation ? ` (${e.designation})` : ""}
                    </div>
                    {e.summary && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{e.summary}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* Builds a short, exec-briefing style summary for one of the three
   categories: new logos, partner connect, or everything else
   (deal follow-ups, renewals, contract discussions, reviews, etc). */
function buildCategorySummary(kind, entries) {
  const uniqueAccounts = [...new Set(entries.map((e) => e.accountName).filter(Boolean))];
  const cLevel = entries.filter((e) => e.level === "C Level");

  if (!entries.length) {
    return {
      count: 0,
      uniqueAccounts: 0,
      sentence:
        kind === "newlogo" ? "No new-logo prospecting logged in this range."
        : kind === "partner" ? "No partner touchpoints logged in this range."
        : "No other account activity logged in this range.",
      bullets: [],
    };
  }

  const byAccount = {};
  entries.forEach((e) => { if (e.accountName) byAccount[e.accountName] = (byAccount[e.accountName] || 0) + 1; });
  const topAccounts = Object.entries(byAccount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

  let sentence;
  if (kind === "newlogo") {
    sentence =
      `${entries.length} new-logo conversation${entries.length === 1 ? "" : "s"} opened across ${uniqueAccounts.length} prospective account${uniqueAccounts.length === 1 ? "" : "s"}` +
      (cLevel.length ? `, ${cLevel.length} at C-level` : "") +
      (topAccounts.length ? `. Led by ${topAccounts.join(", ")}.` : ".");
  } else if (kind === "partner") {
    sentence =
      `${entries.length} partner touchpoint${entries.length === 1 ? "" : "s"} across ${uniqueAccounts.length} partner${uniqueAccounts.length === 1 ? "" : "s"}` +
      (topAccounts.length ? `, concentrated with ${topAccounts.join(", ")}.` : ".") +
      " Focus: co-sell alignment and pipeline handoffs.";
  } else {
    const byType = {};
    entries.forEach((e) => { if (e.taskType) byType[e.taskType] = (byType[e.taskType] || 0) + 1; });
    const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => `${n} (${c})`);
    sentence =
      `${entries.length} account-management touchpoint${entries.length === 1 ? "" : "s"} across ${uniqueAccounts.length} account${uniqueAccounts.length === 1 ? "" : "s"}` +
      (cLevel.length ? `, ${cLevel.length} at C-level` : "") +
      (topTypes.length ? ` — mainly ${topTypes.join(", ")}.` : ".");
  }

  // Pick up to 4 highlights: prioritize C-level, then most recent, one per account.
  const rank = (e) => (e.level === "C Level" ? 0 : e.level === "Senior Management" ? 1 : 2);
  const prioritized = [...entries].sort((a, b) => rank(a) - rank(b) || (b.date || "").localeCompare(a.date || ""));
  const seen = new Set();
  const bullets = [];
  for (const e of prioritized) {
    if (!e.accountName || seen.has(e.accountName)) continue;
    seen.add(e.accountName);
    const who = e.clientName ? `${e.clientName}${e.designation ? `, ${e.designation}` : ""}` : "";
    bullets.push(`${e.accountName}${who ? ` (${who})` : ""} — ${e.opportunity || e.taskType}`);
    if (bullets.length >= 4) break;
  }

  return { count: entries.length, uniqueAccounts: uniqueAccounts.length, sentence, bullets };
}

function ExecSummaryCard({ icon, title, accent, data }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${accent}`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{title}</div>
        <div className="mono" style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700, color: accent }}>{data.count}</div>
      </div>
      <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.55 }}>{data.sentence}</div>
      {data.bullets.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5, borderTop: `1px solid ${C.line}`, paddingTop: 9 }}>
          {data.bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 11.5, color: C.ink2, display: "flex", gap: 6, lineHeight: 1.4 }}>
              <span style={{ color: accent, flexShrink: 0 }}>—</span> {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RangePicker({ selectedWeek, setSelectedWeek, weeks }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>WEEK OF</label>
      <div style={{ position: "relative" }}>
        <select
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          style={{ ...inputStyle, paddingRight: 30, appearance: "none", fontWeight: 600, minWidth: 220 }}
        >
          {weeks.map((w) => <option key={w} value={w}>Week of {fmtDateShort(w)} ({fmtWeek(w)})</option>)}
          <option value={ALL_TIME}>All time</option>
        </select>
        <ChevronDown size={14} style={{ position: "absolute", right: 10, top: 12, pointerEvents: "none", color: C.muted }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detailed activity — the full, filterable log. Open to everyone.     */
/* ------------------------------------------------------------------ */
function DetailedActivity({ entries, user, onUpdate, onDelete, selectedWeek, setSelectedWeek, seller, setSeller, query, setQuery }) {
  const seeAll = canSeeAllData(user);
  const visibleEntries = useMemo(
    () => (seeAll ? entries : entries.filter((e) => e.name === user)),
    [entries, seeAll, user]
  );

  const weeks = useMemo(() => weeksAvailable(visibleEntries), [visibleEntries]);
  const defaultWeek = useMemo(() => {
    const thisWeek = mondayOf(todayISO());
    if (weeks.includes(thisWeek)) return thisWeek;
    return weeks[0] || thisWeek;
  }, [weeks]);
  // selectedWeek lives in the parent App component so it survives switching
  // tabs. Until the person picks one, fall back to today's week as a default
  // display value only — nothing is written back until they actually choose.
  const effectiveWeek = selectedWeek || defaultWeek;
  const [lastExport, setLastExport] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const value = await fsGetLastExport();
        if (value) setLastExport(value);
      } catch {}
    })();
  }, []);

  const recordExport = async () => {
    const now = new Date().toISOString();
    setLastExport(now);
    try { await fsSetLastExport(now); } catch {}
  };
  const handleExport = (data, label) => {
    exportEntriesToExcel(data, label);
    recordExport();
  };

  const sellers = useMemo(
    () => [...new Set(visibleEntries.map((e) => e.name).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [visibleEntries]
  );

  const range = computeRange(effectiveWeek, visibleEntries);
  const filtered = useMemo(
    () => filterByWeek(visibleEntries, effectiveWeek).filter((e) => seller === ALL_SELLERS || e.name === seller),
    [visibleEntries, effectiveWeek, seller]
  );
  const searched = useMemo(() => {
    if (!query.trim()) return filtered;
    const q = query.trim().toLowerCase();
    return filtered.filter((e) =>
      [e.name, e.accountName, e.clientName, e.taskType, e.pursuitType, e.level, e.designation, e.opportunity, e.summary]
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [filtered, query]);
  const sorted = useMemo(
    () => [...searched].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.loggedAt || "").localeCompare(a.loggedAt || "")),
    [searched]
  );

  const handleDeleteClick = (id) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleSaveEdit = async (id, updates) => {
    await onUpdate(id, updates);
    setEditingEntry(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <SectionHeading
          eyebrow="Full log"
          title="Detailed Tasks"
          sub={
            seeAll
              ? "Every entry the team has captured, exactly as filled in the form."
              : "Your own logged entries. You can edit or delete anything you've logged."
          }
        />
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <RangePicker selectedWeek={effectiveWeek} setSelectedWeek={setSelectedWeek} weeks={weeks} />
          {seeAll && (
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>SELLER</label>
              <div style={{ position: "relative" }}>
                <select
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  style={{ ...inputStyle, paddingRight: 30, appearance: "none", minWidth: 170 }}
                >
                  <option value={ALL_SELLERS}>All sellers</option>
                  {sellers.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: 10, top: 12, pointerEvents: "none", color: C.muted }} />
              </div>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>SEARCH</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: 12, color: C.muted }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Account, client, keyword…"
                style={{ ...inputStyle, paddingLeft: 30, width: 210 }}
              />
            </div>
          </div>
        </div>
      </div>

      <ExportReminder lastExport={lastExport} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          onClick={() => handleExport(sorted, "FilteredView")}
          disabled={!sorted.length}
          style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6, opacity: sorted.length ? 1 : 0.5 }}
        >
          <Download size={14} /> Export this view (.xlsx)
        </button>
        <button
          onClick={() => handleExport(visibleEntries, "FullLog")}
          style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Download size={14} /> Export all data (.xlsx)
        </button>
      </div>

      <Card
        title={`${sorted.length} entr${sorted.length === 1 ? "y" : "ies"}`}
        sub={`${effectiveWeek === ALL_TIME ? "All time" : `Week of ${fmtDateShort(range.start)} — ${fmtWeek(range.start)}`}${seller === ALL_SELLERS ? "" : ` · ${seller}`}`}
      >
        {sorted.length === 0 ? (
          <div style={{ padding: "28px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>No entries match.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={th}>Date</th>
                  <th style={th}>Seller / CP</th>
                  <th style={th}>Task type</th>
                  <th style={th}>Account</th>
                  <th style={th}>Client</th>
                  <th style={th}>Pursuit</th>
                  <th style={th}>Level</th>
                  <th style={th}>Designation</th>
                  <th style={th}>Opportunity</th>
                  <th style={{ ...th, minWidth: 220 }}>Discussion summary</th>
                  <th style={{ ...th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((e) => {
                  const editable = canEditRow(user, e);
                  const weekMismatch = e.date && e.weekOf && mondayOf(e.date) !== e.weekOf;
                  return (
                    <tr key={e.id || `${e.name}-${e.date}-${e.accountName}-${e.opportunity}`}>
                      <td style={td} className="mono">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          {fmtDateShort(e.date)}
                          {weekMismatch && (
                            <AlertCircle size={12} color={C.coral} title={`Logged under Week of ${fmtDateShort(e.weekOf)}, but this date falls in the week of ${fmtDateShort(mondayOf(e.date))}. Edit to fix.`} />
                          )}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Avatar name={e.name} size={20} /> {e.name}
                        </div>
                      </td>
                      <td style={td}>{e.taskType}</td>
                      <td style={{ ...td, fontWeight: 600 }}>{e.accountName}</td>
                      <td style={td}>{e.clientName}</td>
                      <td style={td}>{e.pursuitType}</td>
                      <td style={td}>{e.level && <Tag color={LEVEL_COLOR[e.level]}>{e.level}</Tag>}</td>
                      <td style={{ ...td, color: C.muted }}>{e.designation}</td>
                      <td style={{ ...td, color: C.muted }}>{e.opportunity}</td>
                      <td style={{ ...td, color: C.muted, maxWidth: 320 }}>{e.summary}</td>
                      <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                        {editable ? (
                          confirmDeleteId === e.id ? (
                            <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>Delete?</span>
                              <button onClick={() => handleDeleteClick(e.id)} title="Confirm delete" style={iconBtn(C.coral)}><Check size={13} /></button>
                              <button onClick={() => setConfirmDeleteId(null)} title="Cancel" style={iconBtn(C.muted)}><X size={13} /></button>
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", gap: 4 }}>
                              <button onClick={() => setEditingEntry(e)} title="Edit entry" style={iconBtn(C.ink2)}><Pencil size={13} /></button>
                              <button onClick={() => handleDeleteClick(e.id)} title="Delete entry" style={iconBtn(C.coral)}><Trash2 size={13} /></button>
                            </span>
                          )
                        ) : (
                          <span style={{ color: "#C6CBD2", fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          currentUser={user}
          team={sellers}
          entries={entries}
          onCancel={() => setEditingEntry(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

const iconBtn = (color) => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.line}`,
  background: "#fff", color, cursor: "pointer",
});

/* Edit modal — reuses the same field set as the log form, pre-filled. */
function EditEntryModal({ entry, currentUser, team, entries, onCancel, onSave }) {
  const [form, setForm] = useState({ ...entry });
  const [saving, setSaving] = useState(false);
  const [weekTouched, setWeekTouched] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const weekOptions = useMemo(() => buildWeekOptions(entries), [entries]);
  const canReassign = isAdmin(currentUser);

  const handleDateChange = (v) => {
    setForm((f) => (weekTouched ? { ...f, date: v } : { ...f, date: v, weekOf: mondayOf(v) }));
  };
  const handleWeekChange = (v) => {
    setWeekTouched(true);
    set("weekOf", v);
  };
  const mismatch = form.date && form.weekOf && mondayOf(form.date) !== form.weekOf;

  const handleSave = async () => {
    setSaving(true);
    const { id, ...updates } = form;
    await onSave(entry.id, updates);
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,35,63,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 24, width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="disp" style={{ fontSize: 17, fontWeight: 700 }}>Edit entry</div>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4 }}><X size={18} /></button>
        </div>

        {mismatch && (
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#FDF3EE", border: "1px solid #F0CDBB", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12.5, color: "#8A4426" }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            Date and Week of don't match — the date falls in the week of {fmtDateShort(mondayOf(form.date))}, not {fmtDateShort(form.weekOf)}. Double-check before saving.
          </div>
        )}

        {canReassign && (
          <Field label="Seller / CP" style={{ marginBottom: 16, maxWidth: 280 }}>
            <select value={form.name} onChange={(e) => set("name", e.target.value)} style={inputStyle}>
              {[...new Set([...(team || []), form.name])].sort((a, b) => a.localeCompare(b)).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
        )}

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Field label="Date of interaction" style={{ flex: "1 1 160px" }}>
            <input type="date" value={form.date} onChange={(e) => handleDateChange(e.target.value)} style={{ ...inputStyle, ...(mismatch ? { borderColor: C.coral } : {}) }} />
          </Field>
          <Field label="Week of" style={{ flex: "1 1 220px" }}>
            <select value={form.weekOf} onChange={(e) => handleWeekChange(e.target.value)} style={{ ...inputStyle, ...(mismatch ? { borderColor: C.coral } : {}) }}>
              {weekOptions.map((w) => <option key={w} value={w}>{fmtDateShort(w)} – {fmtDateShort(addDays(w, 4))}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Field label="Task type" style={{ flex: "1 1 220px" }}>
            <select value={form.taskType} onChange={(e) => set("taskType", e.target.value)} style={inputStyle}>
              {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Pursuit type" style={{ flex: "1 1 160px" }}>
            <select value={form.pursuitType} onChange={(e) => set("pursuitType", e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {PURSUIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Level" style={{ flex: "1 1 160px" }}>
            <select value={form.level} onChange={(e) => set("level", e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Field label="Account name" style={{ flex: "1 1 220px" }}>
            <input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Client name" style={{ flex: "1 1 220px" }}>
            <input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Field label="Designation" style={{ flex: "1 1 220px" }}>
            <input value={form.designation} onChange={(e) => set("designation", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Opportunity" style={{ flex: "1 1 220px" }}>
            <input value={form.opportunity} onChange={(e) => set("opportunity", e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <Field label="Discussion summary" style={{ marginBottom: 20 }}>
          <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PivotTable({ title, sub, rows, rowLabel, colorMap, accent }) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card title={title} sub={sub}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr>
            <th style={th}>{rowLabel}</th>
            <th style={{ ...th, textAlign: "right" }}>Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: (colorMap && colorMap[r.name]) || accent || C.ink2, flexShrink: 0 }} />
                  {r.name}
                  <span style={{ flex: 1, minWidth: 20 }} />
                  <span style={{ width: 60, height: 5, borderRadius: 3, background: C.line, overflow: "hidden", display: "inline-block" }}>
                    <span style={{ display: "block", height: "100%", width: `${(r.count / max) * 100}%`, background: (colorMap && colorMap[r.name]) || accent || C.ink2 }} />
                  </span>
                </div>
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 600 }} className="mono">{r.count}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...td, fontWeight: 700, borderTop: `2px solid ${C.ink}` }}>Grand total</td>
            <td style={{ ...td, textAlign: "right", fontWeight: 700, borderTop: `2px solid ${C.ink}` }} className="mono">{total}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

function Kpi({ label, value, sub, isText, icon }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 10.5, fontWeight: 600, marginBottom: 8 }}>
        {icon} {label.toUpperCase()}
      </div>
      <div className={isText ? "disp" : "mono"} style={{ fontSize: isText ? 15 : 24, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* Reminder banner — nudges whoever's looking at this tab to keep a fresh,
   external backup, since Firestore's free tier isn't a substitute for a
   real backup/export cadence. */
function ExportReminder({ lastExport }) {
  if (!lastExport) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#FDF3EE", border: `1px solid #F0CDBB`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: "#8A4426" }}>
        <AlertCircle size={15} style={{ flexShrink: 0 }} />
        No backup exported yet. Use "Export all data" below to keep a copy outside this app.
      </div>
    );
  }
  const days = Math.floor((new Date() - new Date(lastExport)) / 86400000);
  const stale = days >= 14;
  const warn = days >= 7 && days < 14;
  const bg = stale ? "#FDF3EE" : warn ? "#FDF8ED" : "#EFF7F3";
  const border = stale ? "#F0CDBB" : warn ? "#EFDFAF" : "#C9E4D6";
  const fg = stale ? "#8A4426" : warn ? "#8A6A1E" : "#1F5F4F";
  const label = days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12.5, color: fg }}>
      {stale || warn ? <AlertCircle size={15} style={{ flexShrink: 0 }} /> : <Check size={15} style={{ flexShrink: 0 }} />}
      Last exported {label}.
      {stale && " It's been a while — export a fresh backup."}
    </div>
  );
}

function Card({ title, sub, children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, ...style }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#fff", background: color || C.ink2, padding: "2px 7px", borderRadius: 999, letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

const th = { textAlign: "left", padding: "8px 10px", fontSize: 11, fontWeight: 700, color: C.muted, borderBottom: `1px solid ${C.line}`, letterSpacing: 0.3 };
const td = { padding: "9px 10px", borderBottom: `1px solid ${C.line}` };
