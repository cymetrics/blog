---
title: Story of critical security flaws I found in Glints
date: 2022-02-08
tags: [Security]
author: huli
layout: en/layouts/post.njk
description: In July 2021, we found 4 vulnerabilities in Glints. If a malicious actor exploits the vulnerabilities, they could have stolen your resume.
---

<!-- summary -->
<!-- In July 2021, we found 4 vulnerabilities in Glints. If a malicious actor exploits the vulnerabilities, they could have stolen your resume. -->
<!-- summary -->

<div data-nosnippet>
2022-02-10: Update title from "How I hacked Glints and your resume" to "Story of critical security flaws I found in Glints" 
</div>

Glints is a job search platform based in Singapore, and they just got a [20M investment](https://www.inside.com.tw/article/23099-glints-c-round) last year, they have a team in Taiwan as well.

In July 2021, I found [Glints bug bounty program](https://security.glints.com/) so I spent some time on it, and I found 4 vulnerabilities in total in the end.

The vulnerabilities I found could have:

1. Stole every applicant's personal information, including name, phone, birthday, resume, and email
2. Stole every recruiter's personal information, including name, job title, team name, and email

In other words, the attacker can steal all users' information by exploiting the vulnerabilities.

Let's see what it is.

## 1. Job application IDOR leads to user information exposure

There are two roles at Glints: employee and employer. For now, anyone can create an employer account, but still need to do the verification when posting new jobs.

For sure, there is a portal for the employer to manage jobs and candidates:

![portal](/img/posts/huli/how-i-hacked-glints-and-your-resume/p1-applications.png)

Here is the API for checking job applications:`/api/recruiterats/jobApplications?where={"JobId": "55e137a1-f96e-4720-9b08-7eb2749e1557"}`

Part of API response：

``` json
{
    "candidate": {
        "id": "44007523-f7a8-411d-b2c4-57c68a976534",
        "profilePic": "6f14ffc62f3f53d8dcb22a4bfc1da6c8.png",
        "firstName": "Peter",
        "lastName": "劉",
        "email": "xof5566@yopmail.com",
        "phone": "+886-999999999",
        "resume": "bb042b7400c444659fdedf79a9c8daf3.pdf",
        "salaryExpectation": null,
        "currencyCode": null,
        "recentJob": {
            "title": "工程師"
        },
        "lastSeen": "2021-07-22T01:58:14.859Z",
        "country": "Taiwan",
        "city": "Taipei"
    }
}
```

In the response, there are applicant's name, email, phone and resume file name.

After seeing the API URL, I did one thing which all pentesters will do: change `JobId` to another one which belongs to another company, and to my surprise, it works:

![idor](/img/posts/huli/how-i-hacked-glints-and-your-resume/p2-idor.png)

We can find `JobId` easily because it's public, we can find it in the URL like this：https://glints.com/tw/opportunities/jobs/consultant/55e137a1-f96e-4720-9b08-7eb2749e1557

If I were an attacker, I can write a script to fetch all the job ids from Glints, and exploit the vulnerability to get all personal data from all applicants.

### Remediation

Glints fixed the vulnerability by checking `JobId` and implementing correct access control.

## 2. RSS feature IDOR leads to user information exposure

Glints has a "RSS feed" feature to let users connect to Slack or other services:

![rss](/img/posts/huli/how-i-hacked-glints-and-your-resume/p3-rss.png)

There are the applicant's name, email, and resume in the response:

![rss content](/img/posts/huli/how-i-hacked-glints-and-your-resume/p4-rss-content.png)

Here is the RSS feed url:`https://employers.glints.com/api/feed/jobs/{RSS_ID}/approved-candidates?UserId={companyOwnerId}`

To forge the URL, we need the correct RSS_ID for the specific job and user id as well. It's easy to get user id because company information is public, but how about RSS_ID?

I found that there is an API for getting jobs from certain companies:`https://employers.glints.tw/api/companies/03638b7f-2da0-4b68-9e92-1be9350600ba/jobs?where={"status":"open"}&include=jobSalaries,Groups,City,Country`

I guessed they used a Node.js ORM called [Sequelize](https://sequelize.org/) in back-end because I am familiar with this library and I found that the naming convention for query string is similar to it.

Then, I tried to add a few parameters but most of them did not work, except for one important parameter: attributes.

This field decides what to return from Sequelize, for example, `attributes=id` means it returns id field only in the response. So, I put `rssId` in the attribute field, and it works:

![rss-id](/img/posts/huli/how-i-hacked-glints-and-your-resume/p5-rss-id.png)

By sending this parameter, we can get  job id, rss id, and company owner's id, then we can query RSS feed to get all applicant's data.

### Remediation

Glints remove this feature entirely because of low usage.

## 3. User information exposure

For vulnerability #1 and #2, only employer accounts can exploit it. But for this one, anyone can.

After registering an account on Glints, you will have a user id and a public profile page, like this:https://glints.com/tw/profile/public/44007523-f7a8-411d-b2c4-57c68a976534

![public page](/img/posts/huli/how-i-hacked-glints-and-your-resume/p6-page.png)

`44007523-f7a8-411d-b2c4-57c68a976534` is my user id which is also shown on the URL.

There is another API for getting user profile: https://glints.com/api/publicProfiles/44007523-f7a8-411d-b2c4-57c68a976534

![profile api](/img/posts/huli/how-i-hacked-glints-and-your-resume/p7-profile-api.png)

Sensitive information has already been filtered, like phone and email. But, one column has been forgotten: resume. Resume field represents file name only, like `badf34128adefqcxsq.pdf`, and Glints stores all the resumes in the same place, the URL rule is: https://glints-dashboard.s3.ap-southeast-1.amazonaws.com/resume/xxxxx.pdf

In other words, by just knowing the file name of the resume, we can download the file directly. If I know someone's user id, I can get their resume by exploiting the API we just mentioned, and it usually contains personal data like email, phone, even address.

Now, how do we find a bunch of user id?

We can do it by google hacking!

Because all the public profile page has the same URL pattern, google this keyword can help you to find a lot of user profile page and user id: `inurl:profile/public site:glints.com`. Then, we use these user ids to get their resume.

![google hacking](/img/posts/huli/how-i-hacked-glints-and-your-resume/p8-google.png)

### Remediation

Glints remove sensitive fields like resume from the response.

## 4. Recruiter information exposure

By far, we talked about the vulnerabilities of employees only, let's see a different vulnerability.

I scanned the subdomain of glints.com and found an interesting page: https://superpowered.glints.com/

![website](/img/posts/huli/how-i-hacked-glints-and-your-resume/p9-website.png)

It requires a Google account with a certain suffix, so we can't log in. But, we can find some clues in JS file! Usually, those files are minified and hard to read, but we can use the search function on Chrome Devtool.  For example, I searched for "query":

![search query](/img/posts/huli/how-i-hacked-glints-and-your-resume/p10-query.png)

From the results, you can see a GraphQL query called `findRecruiters`, the parameters are also available in source code:

``` json
query {
    findRecruiters(input:{}) {
        id,
        email,
        role,
        displayName,
        fullName,
        jobTitle,
        jobStatus

        team {
            labels
        }
    }
}
```

In response, there are the name, job title, team, and email of every single recruiter:

![](https://i.imgur.com/DCxWBdJ.png)


### Remediation

Glints implemented access control, a guest is unable to access this query anymore.

## Summary

Most of the vulnerabilities I found are about access control. When access control is broken, it's easy to access others' data. It's not a good thing for job platforms like Glints, because there are name, email, phone, even address in a resume. 

That's why all 4 vulnerabilities are identified as high-risk issues, worth 1600 SGD bounty in total.

Timeline：

* `2021-07-09` First vulnerability report
* `2021-07-09` Glints replied and they are checking
* `2021-07-13` Glints confirmed the vulnerabilities and working on the fix
* `2021-07-14` Second vulnerability report
* `2021-07-20` Glints replied and only one vulnerability is fixed, others still fixing
* `2021-08-18` I sent an email to Glints to check the latest status, no response
* `2021-08-31` I sent an email again, no response
* `2021-09-09` again and still no response
* `2021-09-20` I opened an issue on their bug bounty program repo, no response
* `2021-10-04` Glints replied to my email and said that they will get back to me tomorrow, but I got no response
* `2021-10-20` I sent a follow-up email
* `2021-10-26` I tweeted about the vulnerability without details because it's still not fixed, then I got a response from a co-founder at Glints 
* `2021-10-27` Glints asked me for payment detail
* `2021-11-11` I received part of the bounty and sent an email to ask the status of vulnerabilities
* `2021-11-11` Glints replied and confirmed that all issues are fixed
* `2021-12-07` I received bounty in full
